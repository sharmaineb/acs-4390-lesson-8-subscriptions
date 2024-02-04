// import dependencies
const { ApolloServer, gql, PubSub } = require('apollo-server');

// handle events associated with subscriptions
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
  { channel: 'general', message: 'hello world', date: new Date() }
];

// resolvers
const resolvers = {
  Query: {
    posts: (_, { channel }) => data.filter(post => post.channel === channel),
    channels: () => Array.from(new Set(data.map(post => post.channel))),
  },
  Mutation: {
    addPost: (_, { channel, message }) => {
      const post = { channel, message, date: new Date() };
      data.push(post);
      pubsub.publish('NEW_POST', { newPost: post, channel });
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
});

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});

// example queries:
// List Channels
// query ListChannels {
//   channels
// }

// Add Channel
// mutation AddChannel {
//   addChannel(name: "general")
// }

// Subscribe to New Channels
// subscription SubscribeToNewChannels {
//   newChannel
// }

// List Posts for a Channel
// query ListPostsForChannel {
//   posts(channel: "general") {
//     message
//     date
//   }
// }

// Add Post to a Channel
// mutation AddPostToChannel {
//   addPost(channel: "general", message: "Hello, world!")
// }

// Subscribe to New Posts in a Channel
// subscription SubscribeToNewPostsInChannel {
//   newPost(channel: "general") {
//     message
//     date
//   }
// }