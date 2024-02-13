// import dependencies
const { ApolloServer, gql, PubSub } = require('apollo-server');

// subscriptions
const pubsub = new PubSub();

// schema
const typeDefs = gql`
  type Post {
    message: String!
    date: String!
  }

  type Query {
    posts(channel: String!): [Post!]!
    channels: [String!]!
  }

  type Mutation {
    addPost(channel: String!, message: String!): Post!
    addChannel(name: String!): String!
  }

  type Subscription {
    newPost(channel: String!): Post!
    newChannel: String!
  }
`;

// mock data
const data = [
  { channel: 'general', message: 'hello world', date: new Date().toISOString() }
];

// resolvers
const resolvers = {
  Query: {
    posts: (_, { channel }) => data.filter(post => post.channel === channel),
    channels: () => Array.from(new Set(data.map(post => post.channel))),
  },
  Mutation: {
    addPost: (_, { channel, message }) => {
      const post = { channel, message, date: new Date().toISOString() };
      data.push(post);
      pubsub.publish(`NEW_POST_${channel}`, { newPost: post });
      console.log('New post added:', post); 
      return post;
    },
    addChannel: (_, { name }) => {
      const channel = name.toLowerCase();
      pubsub.publish('NEW_CHANNEL', { newChannel: channel });
      return `Channel "${channel}" added successfully.`;
    },
  },
  Subscription: {
    newPost: {
      subscribe: (_, { channel }) => pubsub.asyncIterator(`NEW_POST_${channel}`),
    },
    newChannel: {
      subscribe: () => pubsub.asyncIterator('NEW_CHANNEL'),
    },
  },
};

// create and start the server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  formatError: (error) => {
    console.error(error); 
    return error;
  },
});

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});

// example queries:
// query {
//   posts(channel: "general") {
//     message
//     date
//   }
// }

// mutation {
//   addPost(channel: "general", message: "This is a new post!") {
//     message
//     date
//   }
// }

// subscription {
//   newPost(channel: "general") {
//     message
//     date
//   }
// }