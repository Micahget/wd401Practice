/* eslint-disable */
const request = require('supertest')
const app = require('../app')
const cheerio = require("cheerio");
const db = require("../models/index");

let server, agent;
function extractCsrfToken(res) {
  var $ = cheerio.load(res.text);
  return $('[name="_csrf"]').val();
}

// helper function for login
const login = async (agent, username, password) => {
  let res = await agent.get("/login");
  let csrfToken = extractCsrfToken(res);
  res = await agent.post("/session").send({
    email: username,
    password: password,
    _csrf: csrfToken,
  });
};


describe("Sport Scheduler", function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(4000, () => { }); // we use differet port for testing to avoid conflicts
    agent = request.agent(server);
  });

  afterAll(async () => {
    try {
      await db.sequelize.close();
      await server.close();
    } catch (error) {
      console.log(error);
    }
  });

  // test to sign up  user
  test("Signs up an user ", async () => {
    let res = await agent.get("/signup");
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/users").send({
      id: 1,
      firstName: "John",
      lastName: "Smith",
      email: "John@gmail.com",
      password: "123456",
      role: "user",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });

  // // sign out test
  test("sign out", async () => {
    let res = await agent.get("/scheduler");
    expect(res.statusCode).toBe(200);

    res = await agent.get("/signout");
    expect(res.statusCode).toBe(302);
    res = await agent.get("/scheduler");
    expect(res.statusCode).toBe(302);
  });

  // test to add a new session
  test("add a new session", async () => {
    const agent = request.agent(server);
    await login(agent, "John@gmail.com", "123456");

    let res = await agent.get("/newSession/Football"); // get the form
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/newSession").send({
      // post the form
      date: new Date().toISOString(),
      id: 1,
      place: "Cairo",
      playerName: "John, Smith, Mark",
      totalPlayers: 10,
      sport: "Football",
      userId: 1,
      active: true,
      Reason: null,
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });

  // add new sport
  test("add new Sport", async () => {
    const agent = request.agent(server);
    await login(agent, "John@gmail.com", "123456");
    const validSport = "boxing";

    let res = await agent.get("/newSport");
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/newSport").send({
      sport: validSport,
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  }
  );
});

