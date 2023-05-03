// rutas-cursos.js
const express = require("express");
const router = express.Router();

const mongoose = require("mongoose");
const Wall = require("../models/model-wall");
const Pilot = require("../models/model-pilot");
const checkAuth = require("../middleware/check-auth"); // (1) Importamos middleware de autorización

// * Recuperar cursos desde la BDD en Atlas
router.get("/", async (req, res, next) => {
  let walls;
  try {
    walls = await Wall.find({}).populate("Pilot","-password")
  } catch (err) {
    const error = new Error("There's been an error. It's been impossible to recover the data");
    error.code = 500;
    return next(error);
  }
  res.status(200).json({
    mensaje: "All the Walls",
    walls: walls,
  });
});

// * Get a wall by  Id
router.get("/:id", async (req, res, next) => {
  const idWall = req.params.id;
  let wall;
  try {
    wall = await Wall.findById(idWall).populate("Pilot","-email");
  } catch (err) {
    const error = new Error(
      "There's been an error. It's been impossible to recover the data"
    );
    error.code = 500;
    return next(error);
  }
  if (!wall) {
    const error = new Error(
      "It's been impossible to find the wall"
    );
    error.code = 404;
    return next(error);
  }
  res.json({
    mensaje: "Wall found",
    wall: wall,
  });
});

// ! Middleware para autorización
router.use(checkAuth)

// * Crear un nuevo curso (y el docente relacionado) y guardarlo en Atlas
router.post("/", async (req, res, next) => {
  // ? Primero creamos el curso y lo guardamos en Atlas
  const { message, pilot } = req.body;
  const nuevoCurso = new Curso({
    // Nuevo documento basado en el Model Curso.
    message: message,
    pilot: pilot,
    
  });
  // ? Localizamos al docente que se corresponde con el que hemos recibido en el request
  let pilotSearching;
  try {
    pilotSearching = await Pilot.findById(req.body.pilot);
  } catch (error) {
    const err = new Error("Creation has failed");
    err.code = 500;
    return next(err);
  }
  console.log(pilotSearching);
  // ? Si no está en la BDD mostrar error y salir
  if (!pilotSearching) {
    const error = new Error(
      "Locating the crew member has been impossible"
    );
    error.code = 404;
    return next(error);
  }
  /**
   * ? Si está en la BDD tendremos que:
   * ?  1 - Guardar el nuevo curso
   * ?  2 - Añadir el nuevo curso al array de cursos del docente localizado
   * ?  3 - Guardar el docente, ya con su array de cursos actualizado
   */
  console.log(pilotSearching);
  try {
    await newWall.save(); // ? (1)
    pilotSearching.walls.push(newWall); // ? (2)
    await pilotSearching.save(); // ? (3)
  } catch (error) {
    const err = new Error("Creating the new wall has failed");
    err.code = 500;
    return next(err);
  }
  res.status(201).json({
    mensaje: "Wall added",
    wall: newWall,
  });
});

// * Modificar un curso en base a su id ( y su referencia en docentes)
router.patch("/:id", async (req, res, next) => {
  const idWall = req.params.id;
  let wallSearching;
  try {
    wallSearching = await Wall.findById(idWall).populate("Pilot"); // (1) Localizamos el curso en la BDD
  } catch (error) {
    const err = new Error(
      "Ha habido algún problema. No se ha podido actualizar la información del curso"
    );
    err.code = 500;
    throw err;
  }
  // // ! Verificación de usuario
  if (wallSearching.pilot.id.toString() !== req.userData.userId) {
    // Verifica que el creador en la BDD sea el mismo que viene en el req. (headers)
    const err = new Error("No tiene permiso para modificar este curso");
    err.code = 401; // Error de autorización
    return next(err);
  }
  // ? Si existe el curso y el usuario se ha verificado
  try {
    wallSearching = await Wall.findById(idWall).populate("Pilot");
    // ? Bloque si queremos modificar el docente que imparte el curso
    if (req.body.pilot) {
      wallSearching.pilot.walls.pull(wallSearching); // * Elimina el curso del docente al que se le va a quitar
      await wallSearching.pilot.save(); // * Guarda dicho docente
      pilotSearching = await Pilot.findById(req.body.pilot); // * Localiza el docente a quien se le va a reasignar el curso
      pilotSearching.walls.push(wallSearching); // * Añade al array de cursos del docente el curso que se le quitó al otro docente
      pilotSearching.save(); // * Guardar el docente con el nuevo curso en su array de cursos
    }
    // ? Si queremos modificar cualquier propiedad del curso, menos el docente.
    wallSearching = await Wall.findByIdAndUpdate(idwall, req.body, {
      new: true,
      runValidators: true,
    }).populate("Pilot");
  } catch (err) {
    console.log(err.message);
    const error = new Error(
      "Ha habido algún error. No se han podido modificar los datos"
    );
    error.code = 500;
    return next(error);
  }
  res.json({
    message: "Curso modificado",
    wall: wallSearching,
  });
});



// * Eliminar un curso en base a su id (y el docente relacionado)
router.delete("/:id", async (req, res, next) => {
  const idWall = req.params.id;
  let wall;
  try {
    wall = await Wall.findById(idWall).populate("Pilot"); // ? Localizamos el curso en la BDD por su id
  } catch (err) {
    const error = new Error(
      "Ha habido algún error. No se han podido recuperar los datos para eliminación"
    );
    error.code = 500;
    return next(error);
  }
  if (!wall) {
    // ? Si no se ha encontrado ningún curso lanza un mensaje de error y finaliza la ejecución del código
    const error = new Error(
      "No se ha podido encontrar un curso con el id proporcionado"
    );
    error.code = 404;
    return next(error);
  }

  // // ! Verificación de usuario
  if (wall.pilot.id.toString() !== req.userData.userId) {
    // Verifica que el creador en la BDD sea el mismo que viene en el req. (headers) procedente de checkAuth
    const err = new Error("No tiene permiso para eliminar este curso");
    err.code = 401; // Error de autorización
    return next(err);
  }

  // ? Si existe el curso y el usuario se ha verificado
  try {
    // ? (1) Eliminar curso de la colección
    await wall.deleteOne();
    // ? (2) En el campo docente del documento curso estará la lista con todos lo cursos de dicho docente. Con el método pull() le decimos a mongoose que elimine el curso también de esa lista.
    wall.pilot.walls.pull(wall);
    await wall.pilot.save(); // ? (3) Guardamos los datos de el campo docente en la colección curso, ya que lo hemos modificado en la línea de código previa
  } catch (err) {
    const error = new Error(
      "Ha habido algún error. No se han podido eliminar los datos"
    );
    error.code = 500;
    return next(error);
  }
  res.json({
    message: "Curso eliminado",
  });
});

module.exports = router;
