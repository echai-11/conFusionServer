const express = require("express");
const authenticate = require("../authenticate");
const Favorites = require("../models/favorites");
const Dishes = require("../models/dishes");
const cors = require("./cors");

const favoriteRouter = express.Router();

favoriteRouter.use(express.json());

favoriteRouter
  .route("/")
  .options(cors.cors, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorites.find({ user: req.user._id })
      .populate("dish")
      .populate("user")
      .then(
        (favorite) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(favorite);
        },
        (err) => {
          next(err);
        }
      )
      .catch((err) => {
        next(err);
      });
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    //example req.body:
    // [{ _id: "6150f0b99bc427fc9336c7cb" }, { _id: "615629da74c041594a59b655" }];
    req.body.forEach((dishId) => {
      Favorites.find({ user: req.user._id, dish: dishId }, (err, favorite) => {
        if (err) {
          return next(err);
        }
        if (favorite && favorite.length) {
          return next(err);
        } else {
          Dishes.findById(dishId)
            .then(
              (dish) => {
                if (dish !== null) {
                  Favorites.create({
                    dish: dishId,
                    user: req.user._id,
                  })
                    .then(
                      (favorite) => {
                        Favorites.find({ user: req.user._id })
                          .populate("dish")
                          .populate("user")
                          .then(
                            (favorite) => {
                              res.statusCode = 200;
                              res.setHeader("Content-Type", "application/json");
                              res.json(favorite);
                            },
                            (err) => {
                              next(err);
                            }
                          );
                      },
                      (err) => next(err)
                    )
                    .catch((err) => next(err));
                } else {
                  err = new Error("Dish " + dishId._id + " not found");
                  err.status = 404;
                  return next(err);
                }
              },
              (err) => {
                err = new Error("Dish 2" + dishId._id + " not found");
                err.status = 404;
                return next(err);
              }
            )
            .catch((err) => next(err));
        }
      });
    });
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.remove({ user: req.user._id })
      .then(
        (resp) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(resp);
        },
        (err) => next(err)
      )
      .catch((err) => next(err));
  });

favoriteRouter
  .route("/:dishId")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Dishes.findById(req.params.dishId).then(
      (dish) => {
        if (dish !== null) {
          //find favorites
          Favorites.find(
            { user: req.user._id, dish: req.params.dishId },
            (err, favorite) => {
              if (err) {
                err = new Error("Dish " + req.params.dishId + " not found");
                err.status = 404;
                return next(err);
              }
              if (favorite.length) {
                err = new Error(
                  "Dish " + req.params.dishId + " already exists on favorites"
                );
                err.status = 403;
                return next(err);
              } else {
                Favorites.create({
                  dish: dish._id,
                  user: req.user._id,
                })
                  .then(
                    (favorite) => {
                      Favorites.find({ user: req.user._id })
                        .populate("dish")
                        .populate("user")
                        .then(
                          (favorite) => {
                            res.statusCode = 200;
                            res.setHeader("Content-Type", "application/json");
                            res.json(favorite);
                          },
                          (err) => {
                            next(err);
                          }
                        );
                      res.statusCode = 200;
                      res.setHeader("Content-Type", "application/json");
                      res.json(favorite);
                    },
                    (err) => next(err)
                  )
                  .catch((err) => next(err));
              }
            }
          );
        } else {
          //dish does not exist
          err = new Error("Dish " + req.params.dishId + " not found");
          err.status = 404;
          return next(err);
        }
      },
      (err) => {
        err = new Error("Dish " + req.params.dishId + " not found");
        err.status = 404;
        return next(err);
      }
    );
  })

  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOneAndDelete({ user: req.user._id, dish: req.params.dishId })
      .then(
        (favorite) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(favorite);
        },
        (err) => {
          err = new Error("Dish " + req.params.dishId + " not found");
          err.status = 404;
          return next(err);
          next(err);
        }
      )
      .catch((err) => next(err));
  });

module.exports = favoriteRouter;
