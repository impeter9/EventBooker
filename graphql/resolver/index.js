const bcrypt = require('bcryptjs');

const Event = require('../../models/event');
const User = require('../../models/user');

const events = eventIds => {
    // find all events with one of the Ids passed in {_id: {$in: eventIds}}
    return Event.find({_id: {$in: eventIds}}).then(events => {
        return events.map(event => {
            return { ...event._doc, date: new Date(event._doc.date).toISOString(), creator: user.bind(this, event.creator) };
        });
    })
    .catch(err => {
        throw err;
    })
};

const user = userId => {
    return User.findById(userId)
        .then(user => {
            return { ...user._doc, createdEvents: events.bind(this, user._doc.createdEvents) };
        })
        .catch(err => {
            throw err;
        })
};

module.exports = {
    events: () => {
        // use mongoose populate to populate any realtion it knows, in event.js, the schema ref User doc
        return Event.find().then(events => {
            // filter metadata from mongo with map
            return events.map(event => {
                // return { ...event._doc, _id: event._doc._id.toString() };
                // return { ...event._doc, _id: event.id };
                return { ...event._doc, date: new Date(event._doc.date).toISOString(), creator: user.bind(this, event._doc.creator)};
            });
        }).catch(err => {
            throw err;
        })
    },
    createEvent: (args) => {
        const event = new Event({
            title: args.eventInput.title,
            description: args.eventInput.description,
            price: +args.eventInput.price,
            date: new Date(args.eventInput.date),
            creator: '5ed32e98f09e5218cb583c18'
        });
        let createdEvent;
        return event.save().then(result => {
            // filter metadata from mongo with spread operator
            // bind creates/return the function but avoid to be called before passing down (avoid infinite loop)
            // graphql will only execute the function when user asks for that field ex) creator in this case
            createdEvent = { ...result._doc, date: new Date(event._doc.date).toISOString(), creator: user.bind(this, result._doc.creator) }
            return User.findById('5ed32e98f09e5218cb583c18');
        }).then(user => {
            // add transaction for atomicity
            if (!user) {
                throw new Error('User not found.');
            }
            user.createdEvents.push(event);
            return user.save();
        }).then(result => {
            return createdEvent;
        }).catch(err => {
            console.log(err);
            throw err;
        });
    },
    createUser: (args) => {
        return User.findOne({email: args.userInput.email}).then(user => {
            if (user) {
                throw new Error('User exists already.');
            }
            return bcrypt.hash(args.userInput.password, 12);
        }).then(hashedPassword => {
            const user = new User({
                email: args.userInput.email,
                password: hashedPassword
            });
            return user.save();
        }).then(result => {
            // return { ...result._doc, _id: result.id }; mongo fixed the ObjectID parsing to string issue
            // for security reason, do not return the salted password
            return { ...result._doc, password: null };
        }).catch(err => {
            throw err;
        });
    }
}