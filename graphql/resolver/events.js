const Event = require('../../models/event');
const User = require('../../models/user');

const { transformEvent } = require('./merge');

module.exports = {
  events: async () => {
    try {
      // use mongoose populate to populate any realtion it knows, in event.js, the schema ref User doc
      const events = await Event.find();
      // filter metadata from mongo with map
      return events.map((event) => {
        return transformEvent(event);
      });
    } catch (err) {
      throw err;
    }
  },
  createEvent: async (args, req) => {
    // gets request argument automatically
    if (!req.isAuth) {
      // make sure the user is authenticated for creating events
      throw new Error('Unauthenticated!');
    }
    const event = new Event({
      title: args.eventInput.title,
      description: args.eventInput.description,
      price: +args.eventInput.price,
      date: new Date(args.eventInput.date),
      creator: req.userId,
    });
    let createdEvent;
    try {
      const result = await event.save();
      // filter metadata from mongo with spread operator
      // bind creates/return the function but avoid to be called before passing down (avoid infinite loop)
      // graphql will only execute the function when user asks for that field ex) creator in this case
      createdEvent = transformEvent(result);
      const creator = await User.findById(req.userId);
      // add transaction for atomicity
      if (!creator) {
        throw new Error('User not found.');
      }
      creator.createdEvents.push(event);
      await creator.save();
      return createdEvent;
    } catch (err) {
      console.log(err);
      throw err;
    }
  },
};
