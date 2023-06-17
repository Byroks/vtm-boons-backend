describe("Sample Test", () => {
	it("should test that true === true", () => {
		expect(true).toBe(true);
	});
});

const request = require("supertest");
const app = require("../index");
describe("Post Endpoints", () => {
	it("should create a new post", async () => {
		const res = await request(app).post("/api/posts").send({});
		expect(res.statusCode).toEqual(400);
		expect(res.body).toHaveProperty("post");
	});
});
