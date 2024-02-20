// import both funtions from subtraction.js
const subtraction = require("./subtraction");
const add = require("./add");
const multiply = require("./multiply");

// subtraction for 2 nos

test("subtracts 4 - 2 to equal 2", () => {
  expect(subtraction(4, 2)).toBe(2);
});

// addition for 2 nos
test("adds 1 + 2 to equal 3", () => {
  expect(add(1, 2)).toBe(3);
}
);

test("multiply 2 * 2 to equal 4", () => {
  expect(multiply(2, 2)).toBe(4);
});