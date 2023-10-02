const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function list(req, res, next) {
  res.json({ data: orders });
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
      message: `Order must include a ${propertyName}`,
    });
  };
}

function validateDishes(req, res, next) {
  const { data: { dishes } = [] } = req.body;

  if (Array.isArray(dishes) && dishes.length > 0) {
    next();
  } else {
    next({
      status: 400,
      message: "Order must contain at least one dish",
    });
  }
}

function validateDishQuantity(req, res, next) {
  const { data: { dishes } = [] } = req.body;
  dishes.forEach(({ quantity }, index) => {
    if (!quantity || quantity < 1 || !Number.isInteger(quantity)) {
      next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
  });
  next();
}

function validateOrderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((o) => o.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    next();
  }
  next({
    status: 404,
    message: `Order does not exist: ${orderId}.`,
  });
}

function validateOrderIdMatches(req, res, next) {
  let { id } = req.body.data;
  if (id && id !== req.params.orderId) {
    next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${req.params.dishId}`,
    });
  } else {
    next();
  }
}

function validateOrderStatus(req, res, next) {
  const {
    data: { status },
  } = req.body;
  if (
    status === "pending" ||
    status === "preparing" ||
    status === "out-for-delivery" ||
    status === "delivered"
  ) {
    if (status !== "delivered") {
      next();
    } else {
      next({
        status: 400,
        message: "A delivered order cannot be changed",
      });
    }
  }
  next({
    status: 400,
    message:
      "Order must have a status of pending, preparing, out-for-delivery, delivered",
  });
}

function create(req, res, next) {
  const { data: { deliverTo, mobileNumber, dishes = [] } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function read(req, res, next) {
  res.json({ data: res.locals.order });
}

function update(req, res, next) {
  const order = res.locals.order;
  const {
    data: { deliverTo, mobileNumber, status, dishes = [] },
  } = req.body;

  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;

  res.json({ data: order });
}

function destroy(req, res, next) {
  const {status, id} = res.locals.order;
  if (status === "pending"){
    const index = orders.findIndex(o => o.id === id)
  const deletedOrder = orders.splice(index, 1)
  res.sendStatus(204);
  } else {
    next({
        status: 400,
        message: "An order cannot be deleted unless it is pending"
    })
  }
}

module.exports = {
  create: [
    validateBodyHas("deliverTo"),
    validateBodyHas("mobileNumber"),
    validateBodyHas("dishes"),
    validateDishes,
    validateDishQuantity,
    create,
  ],
  update: [
    validateOrderExists,
    validateOrderIdMatches,
    validateOrderStatus,
    validateBodyHas("deliverTo"),
    validateBodyHas("mobileNumber"),
    validateBodyHas("dishes"),
    validateDishes,
    validateDishQuantity,
    update,
  ],
  read: [validateOrderExists, read],
  list,
  destroy: [validateOrderExists, destroy],
};
