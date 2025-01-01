const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const { Neo4jGraphQL } = require("@neo4j/graphql");
const neo4j = require("neo4j-driver");

const typeDefs = `#graphql
    type JamRoom @node {
        id: ID!
        name: String!
        latitude: Float!
        longitude: Float!
        radius: Float!
    }

    type Query {
        getJamRooms: [JamRoom]
        getJamRoom(id: ID!): JamRoom
    }

    type Mutation {
        createJamRoom(name: String!, latitude: Float!, longitude: Float!, radius: Float!): JamRoom
    }
`;

const driver = neo4j.driver(
    'neo4j+s://cb9ac89d.databases.neo4j.io', // Update with your Neo4j URI
    neo4j.auth.basic('neo4j', 'SMBIIXNPgCJSkXFfN6mwAPc76WXaaScb0fJB5s1-PV4') // Replace with your Neo4j username and password
);

const neoSchema = new Neo4jGraphQL({ typeDefs, driver });


async function startApolloServer() {
    const server = new ApolloServer({
        schema: await neoSchema.getSchema(),
    });

    const { url } = await startStandaloneServer(server, {
        context: async ({ req }) => ({ req }),
        listen: { port: 4000 },
    });

    console.log(`🚀 Apollo Server ready at ${url}`);
}

module.exports = { startApolloServer, driver };