// rutas-docentes-token.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs"); // Importación de librería
const jwt = require("jsonwebtoken");

const Pilot = require("../models/model-pilot");

router.get("/", async (req, res, next) => {
  let pilots;
  
  try {
    pilots = await Pilot.find({},"-password")
  } catch (err) {
    const error = new Error("Ha ocurrido un error en la recuperación de datos");
    error.code = 500;
    return next(error);
  }
   
  res.status(200).json({
    SQN: "The whole Crew",
    pilots: pilots,
  });
});
// * Listar un docente en concreto
router.get("/:id", async (req, res, next) => {
  const idPilot = req.params.id;
  let pilot;
  try {
    pilot = await Pilot.findById(idPilot);
  } catch (err) {
    const error = new Error(
      "Error. Impossible to retrieve the data"
    );
    error.code = 500;
    return next(error);
  }
    
  if (!pilot) {
    const error = new Error(
      "No se ha podido encontrar un docente con el id proporcionado"
    );
    error.code = 404;
    return next(error);
  }
  res.json({
    SQN: "Crew member",
    pilot: pilot,
  });
});
// * Creating a new Pilot
router.post("/", async (req, res, next) => {
  const { callSign, rank, platForm, email, password, messages, } = req.body;
  let existPilot;
  try {
    existPilot = await Pilot.findOne({
      email: email,
    });
  } catch (err) {
    const error = new Error(err);
    error.code = 500;
    return next(error);
  }
  if (existPilot) {
    const error = new Error("There's already a crew member with taht  e-mail.");
    error.code = 401; // ! 401: Authentication Failure
    return next(error);
    // ! ATENCIÓN: FIJARSE EN DONDE EMPIEZA Y TERMINA ESTE ELSE
  } else {
    // ? Encriptación de password mediante bcrypt y salt
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 12); // ? Método que produce la encriptación
    } catch (error) {
      const err = new Error(
        "It's been impossible to recruit you. Try again"
      );
      err.code = 500;
      console.log(error.message);
      return next(err);
    }

    const newyPilot = new Pilot({
      callSign, 
      rank, 
      platForm, 
      email,
      password: hashedPassword, // ? La nueva password será la encriptada
      messages,
    });

    try {
      await newyPilot.save();
    } catch (error) {
      const err = new Error("It's been impossible to save the data");
      err.code = 500;
      return next(err);
    }
    // ? Código para la creación del token
    try {
      token = jwt.sign(
        {
          userId: newyPilot.id,
          email: newyPilot.email,
        },
        "clave_supermegasecreta",
        {
          expiresIn: "1h",
        }
      );
    } catch (error) {
      const err = new Error("It's been impossible to go ahead");
      err.code = 500;
      return next(err);
    }
    res.status(201).json({
      userId: newyPilot.id,
      email: newyPilot.email,
      token: token,
    });
  }
});
router.post("/login", async (req, res, next) => {
  const { email, password } = req.body;
  let pilotExist;
  try {
    pilotExist = await Pilot.findOne({
      // ? (1) Comprobación de email
      email: email,
    });
  } catch (error) {
    const err = new Error(
      "It's been impossible to recruit you. Try it again"
    );
    err.code = 500;
    return next(err);
  }
  // ? ¿Qué pasa si el docente no existe?
  if (!pilotExist) {
    const error = new Error(
      "Wrong Credentials 2"
    );
    error.code = 422; // ! 422:User's data is not valid
    return next(error);
  }
  // ? Si existe el docente, ahora toca comprobar las contraseñas.
  let esValidoElPassword = false;
  esValidoElPassword = bcrypt.compareSync(password, pilotExist.password);
  if (!esValidoElPassword) {
    const error = new Error(
      "Wrong Credentials 3"
    );
    error.code = 401; // !401: Authentication Failure 
    return next(error);
  }
  // ? Docente con los credeciales correctos.
  // ? Creamos ahora el token
  // ! CREACIÓN DEL TOKEN
  let token;
  try {
    token = jwt.sign(
      {
        userId: pilotExist.id,
        email: pilotExist.email,
      },
      "clave_supermegasecreta",
      {
        expiresIn: "1h",
      }
    );
  } catch (error) {
    const err = new Error("The procces has failed");
    err.code = 500;
    return next(err);
  }
  res.status(201).json({
    message: "The crew member has succefully logged in",
    userId: pilotExist.id,
    email: pilotExist.email,
    token: token,
  });
});

//* Modifiy crew member's data - Most effective method (findByIdAndUpadate)
router.patch("/:id", async (req, res, next) => {
  const idPilot = req.params.id;
  const changingField= req.body;
  let pilotSearch;
  try {
    pilotSearch = await Pilot.findByIdAndUpdate(
      idPilot,
      changingField,
      {
        new: true,
        runValidators: true,
      }
    ); // (1) Localizamos y actualizamos a la vez el docente en la BDD
  } catch (error) {
    res.status(404).json({
      mensaje: "It's been impossible to update the data",
      error: error.message,
    });
  }
  res.status(200).json({
    mensaje: "Crew member's data has been updated",
    pilot: pilotSearch,
  });
});

// * Eliminar un docente
router.delete("/:id", async (req, res, next) => {
  let pilot;
  try {
    pilot = await Pilot.findByIdAndDelete(req.params.id);
  } catch (err) {
    const error = new Error(
      "There's been an error. It's been impossible to delete the data"
    );
    error.code = 500;
    return next(error);
  }
  res.json({
    mensaje: "Crew member deleted",
    pilot: pilot,
  });
});



module.exports = router;
