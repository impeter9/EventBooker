const express = require('express');
const bodyParser = require('body-parser');
const graphqlHttp = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Event = require('./models/event');
const User = require('./models/user');

const app = express();

app.use(bodyParser.json());

app.use('/graphql', graphqlHttp({
    //schema
    schema: buildSchema(`
        type Event {
            _id: ID!
            title: String!
            description: String!
            price: Float!
            date: String!
        }

        type User {
            _id: ID!
            email: String!
            password: String
        }

        input EventInput {
            title: String!
            description: String!
            price: Float!
            date: String!
        }

        input UserInput {
            email: String!
            password: String!
        }

        type RootQuery {
            events: [Event!]!
        }

        type RootMutation {
            createEvent(eventInput: EventInput): Event
            createUser(userInput: UserInput): User
        }

        schema {
            query: RootQuery
            mutation: RootMutation
        }
    `),
    //resolver
    rootValue: {
        events: () => {
            return Event.find().then(events => {
                // filter metadata from mongo with map
                return events.map(event => {
                    // return { ...event._doc, _id: event._doc._id.toString() };
                    // return { ...event._doc, _id: event.id };
                    return { ...event._doc };
                })
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
                createdEvent = { ...result._doc }
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
    },
    graphiql: true
}));

mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-ns2qt.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`
                    ).then(()=>{
                        app.listen(3000);
                    }).catch(err => {
                        console.log(err);
                    });