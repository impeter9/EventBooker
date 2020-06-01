const bcrypt = require('bcryptjs');

const Event = require('../../models/event');
const User = require('../../models/user');

const events = async eventIds => {
    try {
        // find all events with one of the Ids passed in {_id: {$in: eventIds}}
        const events = await Event.find({_id: {$in: eventIds}});
        events.map(event => {
            return { ...event._doc, date: new Date(event._doc.date).toISOString(), creator: user.bind(this, event.creator) };
        });
        // return events.map
        return events;
    } catch (err) {
        throw err;
    }
};

const user = async userId => {
    try {
        const user = await User.findById(userId);
        return { ...user._doc, createdEvents: events.bind(this, user._doc.createdEvents) };
    } catch (err) {
        throw err;
    }
};

module.exports = {
    events: async () => {
        try {
            // use mongoose populate to populate any realtion it knows, in event.js, the schema ref User doc
            const events = await Event.find();
            // filter metadata from mongo with map
            return events.map(event => {
                // return { ...event._doc, _id: event._doc._id.toString() };
                // return { ...event._doc, _id: event.id };
                return { ...event._doc, date: new Date(event._doc.date).toISOString(), creator: user.bind(this, event._doc.creator)};
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
            createdEvent = { ...result._doc, date: new Date(event._doc.date).toISOString(), creator: user.bind(this, result._doc.creator) };
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
    },
    createUser: async (args) => {
        try{
            const existingUser = await User.findOne({email: args.userInput.email});
            if (existingUser) {
                throw new Error('User exists already.');
            }
            const hashedPassword = await bcrypt.hash(args.userInput.password, 12);
            const user = new User({
                email: args.userInput.email,
                password: hashedPassword
            });
            const result = await user.save();
            // return { ...result._doc, _id: result.id }; mongo fixed the ObjectID parsing to string issue
            // for security reason, do not return the salted password
            return { ...result._doc, password: null };
        } catch (err) {
            throw err;
        }
    }
}