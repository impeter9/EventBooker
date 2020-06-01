const Event = require('../../models/event');
const { transformEvent } = require('./merge');

module.exports = {
    events: async () => {
        try {
            // use mongoose populate to populate any realtion it knows, in event.js, the schema ref User doc
            const events = await Event.find();
            // filter metadata from mongo with map
            return events.map(event => {
                // return { ...event._doc, _id: event._doc._id.toString() };
                // return { ...event._doc, _id: event.id };
                return transformEvent(event);
            })
        } catch (err) {
            throw err;
        }
    },
    createEvent: async (args) => {
        const event = new Event({
            title: args.eventInput.title,
            description: args.eventInput.description,
            price: +args.eventInput.price,
            date: new Date(args.eventInput.date),
            creator: '5ed32e98f09e5218cb583c18'
        });
        let createdEvent;
        try {
            const result = await event.save();
            // filter metadata from mongo with spread operator
            // bind creates/return the function but avoid to be called before passing down (avoid infinite loop)
            // graphql will only execute the function when user asks for that field ex) creator in this case
            createdEvent = transformEvent(result);;
            const creator = await User.findById('5ed32e98f09e5218cb583c18');
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
    }
};