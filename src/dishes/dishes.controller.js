const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function list(req, res, next) {
  res.json({ data: dishes });
}

//middleware to validate that the body of a put or post req has the necessary data
function validateBodyHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({
      status: 400,
      message: `Dish must include a ${propertyName}`,
    });
  };
}

//check the price property format is valid
function pricePropertyIsValid(req, res, next) {
  const {
    data: { price },
  } = req.body;
  //greater than 0 and is an integer
  if (Number.isInteger(price) && price > 0) {
    next();
  } else {
    next({
      status: 400,
      message: "Dish must have a price that is an integer greater than 0",
    });
  }
}

//check image is valid in body
function imageIsValid(req, res, next) {
  const {
    data: { image_url },
  } = req.body;
  if (image_url) {
    next();
  } else {
    next({
      status: 400,
      message: "Dish must include a image_url",
    });
  }
}

//validate the the id links to an existing dish
function validateDishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  } else {
       //ISSUE: not hitting error handler correctly
  next({
    status: 404,
    message: `Dish does not exist: ${dishId}.`,
  });
  }
 
}

function validateDishIdMatches(req, res, next) {
  let { id } = req.body.data;
  if (id && id !== req.params.dishId) {
    next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${req.params.dishId}`,
    });
  } else {
    next();
  }
}

function create(req, res, next) {
  const {
    data: { name, description, price, image_url },
  } = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function read(req, res, next) {
  res.json({ data: res.locals.dish });
}

function update(req, res) {
  const dish = res.locals.dish;
  const { data: { name, description, price, image_url } = {} } = req.body;

  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;

  res.json({ data: dish });
}

module.exports = {
  create: [
    validateBodyHas("name"),
    validateBodyHas("description"),
    validateBodyHas("price"),
    validateBodyHas("image_url"),
    pricePropertyIsValid,
    imageIsValid,
    create,
  ],
  read: [validateDishExists, read],
  list,
  update: [
    validateDishExists,
    validateDishIdMatches,
    validateBodyHas("name"),
    validateBodyHas("description"),
    validateBodyHas("price"),
    validateBodyHas("image_url"),
    pricePropertyIsValid,
    imageIsValid,
    update
  ],
};
