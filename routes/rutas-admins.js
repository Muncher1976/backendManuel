//rutas-docentes-token.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs"); // Importación de librería
const jwt = require("jsonwebtoken");

const Pilot = require("../models/model-pilot");
const checkAuth = require("../middleware/check-auth"); // (1) Importamos middleware de autorización

//* Pilot Login
router.post("/login", async (req, res, next) => {
    const { email, password } = req.body;

    // ¿Qué pasa si el admin no es Manu?
    if (email !== "maverick@hotmail.com")  {
      const error = new Error(
        "No se ha podido identificar al docente. Credenciales erróneos 2"
      );
      error.code = 422; // ! 422: Datos de usuario inválidos
      return next(error);
    }

    let existPilot;
    try {
      existPilot = await Pilot.findOne({
        // ? (1) Comprobación de email
        email: email,
      });
    } catch (error) {
      const err = new Error(
        "No se ha podido realizar la operación. Pruebe más tarde"
      );
      err.code = 500;
      return next(err);
    }

    if(existPilot == null) {
      const error = new Error(
        "No se ha podido identificar al docente. Credenciales erróneos 2"
      );
      error.code = 422; // ! 422: Datos de usuario inválidos
      return next(error);
    }

    //if(!docenteExiste.admin){
    //  const error = new Error(
    //    "No se ha podido identificar al docente. Credenciales erróneos 2"
    //  );
    //  error.code = 422; // ! 422: Datos de usuario inválidos
    //  return next(error);
    //}
    
    // ? Si existe el docente, ahora toca comprobar las contraseñas.
    let esValidoElPassword = false;
    esValidoElPassword = bcrypt.compareSync(password, existPilot.password);
    if (!esValidoElPassword) {
      const error = new Error(
        "No se ha podido identificar al usuario. Credenciales erróneos"
      );
      error.code = 401; // !401: Fallo de autenticación
      return next(error);
    }
    // ? Docente con los credeciales correctos.
    // ? Creamos ahora el token
    // ! CREACIÓN DEL TOKEN
    let token;
    try {
      token = jwt.sign(
        {
          userId: existPilot.id,
          email: existPilot.email,
        },
        "clave_supermegasecreta",
        {
          expiresIn: "1h",
        }
      );
    } catch (error) {
      const err = new Error("El proceso de login ha fallado");
      err.code = 500;
      return next(err);
    }
    res.status(201).json({
      mensaje: "Docente ha entrado con éxito en el sistema",
      userId: existPilot.id,
      email: existPilot.email,
      token: token,
    });
  });
  
  // ! Middleware para autorización
  router.use(checkAuth)
  
  // * Listar todos los docentes
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
      mensaje: "The whole Crew",
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
        "Ha habido algún error. No se han podido recuperar los datos"
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
      mensaje: "Docente encontrado",
      pilot: pilot,
    });
  });

  module.exports = router;