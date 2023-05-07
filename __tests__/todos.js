const request = require("supertest");
var cheerio = require("cheerio");
const db = require("../models/index");
const app = require("../app");
// eslint-disable-next-line no-unused-vars
const { response } = require("../app");

let server, agent;

function extractCsrfToken(res){
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

const login = async (agent, username, password) => {
  let res = await agent.get("/login");
  let csrfToken = extractCsrfToken(res);
  res = await agent.post("/session").send({
    email: username,
    password: password,
    _csrf: csrfToken,
  });
};

describe("Sport Scheduler Application", function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(10000, () => {});
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

  test("Sign up", async ()=> {
    let res = await agent.get("/signup");
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/users").send({
      firstName:"Test",
      lastName:"user A",
      email:"rankr@admin.com",
      password:"admin@admin",
      _csrf:csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });

  test("Sign out",async ()=>{
    let res = await agent.get("/sportList");
    expect(res.statusCode).toBe(200);
    res = await agent.get("/signout");
    expect(res.statusCode).toBe(302);
    res = await agent.get("/sportList");
    expect(res.statusCode).toBe(302);
  });

  test("Creates a new Sport", async () => {
    const agent = request.agent(server);
    await login(agent, "rankr@admin.com", "admin@admin");
    let res = await agent.get("/admin/createSport");
    let csrfToken = extractCsrfToken(res);
    const response = await agent.post("/admin/createSport").send({
      SportName: "Buy milk",
      "_csrf": csrfToken,
    });
    expect(response.statusCode).toBe(302);
  });

  test("Creates a new Session", async () => {
    const agent = request.agent(server);
    let setDate = new Date().toISOString();
    await login(agent, "rankr@admin.com", "admin@admin");
    let res = await agent.get("/sessionCreate/1");
    let csrfToken = extractCsrfToken(res);
    const response = await agent.post("/sessionCreate/1").send({
      date: setDate,
      time: "12:18",
      place: "home",
      player: "meet,rank",
      TotalPlayer: 5,
      "_csrf": csrfToken,
    });
    expect(response.statusCode).toBe(302);
  });

  test("Join a Sport Session", async () => {
    const agent = request.agent(server);
    await login(agent, "rankr@admin.com", "admin@admin");
    let res = await agent.get("/sessionCreate/1");
    // eslint-disable-next-line no-unused-vars
    let csrfToken = extractCsrfToken(res);
    const response = await agent.post("/sessionCreate/1");
    expect(response.statusCode).toBe(302);

  });

 

  test("Mark a todo as incomplete", async () => {
    const agent = request.agent(server);
    await login(agent, "rankr@admin.com", "admin@admin");
    let res = await agent.get("/todo");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    const groupedTodosResponse = await agent
      .get("/todo")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.tdue.length;
    const latestTodo = parsedGroupedResponse.tdue[dueTodayCount - 1];

    res = await agent.get("/todo");
    csrfToken = extractCsrfToken(res);

    let markinCompleteResponse = await agent.put(`/todos/${latestTodo.id}/`).send({
        _csrf: csrfToken,
        completed: false,
      });
    let parsedUpdateResponse = JSON.parse(markinCompleteResponse.text);
    expect(parsedUpdateResponse.completed).toBe(false);

  });


  

  test("Delete a todo", async () => {
    const agent = request.agent(server);
    await login(agent, "rankr@admin.com", "admin@admin");
  let res = await agent.get("/todo"); 
  let csrfToken = extractCsrfToken(res);
  await agent.post("/todos").send({
  _csrf: csrfToken,
  title: "Buy milk",
  dueDate: new Date().toISOString(),
  completed: false,
  });
  const groupedTodosResponse = await agent
  .get("/todo")
  .set("Accept", "application/json"); 
  const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
  expect (parsedGroupedResponse.tdue).toBeDefined();
  const dueTodayCount = parsedGroupedResponse.tdue.length; 
  const latestTodo = parsedGroupedResponse.tdue [dueTodayCount - 1];
  res = await agent.get("/todo"); 
    csrfToken = extractCsrfToken (res);
    const deletedResponse = await agent.delete(`/todos/${latestTodo.id}`).send({
    _csrf: csrfToken,
    });
    expect (deletedResponse.statusCode).toBe (200);
  });
});

  /*test("Fetches all todos in the database using /todos endpoint", async () => {
    await agent.post("/todos").send({
      title: "Buy xbox",
      dueDate: new Date().toISOString(),
      completed: false,
    });
    await agent.post("/todos").send({
      title: "Buy ps3",
      dueDate: new Date().toISOString(),
      completed: false,
    });
    const response = await agent.get("/todos");
    const parsedResponse = JSON.parse(response.text);

    expect(parsedResponse.length).toBe(4);
    expect(parsedResponse[3]["title"]).toBe("Buy ps3");
  });*/
