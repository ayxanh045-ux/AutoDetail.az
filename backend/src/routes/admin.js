const express = require('express');
const {
  getUsers,
  updateUser,
  deleteUser,
  getPosts,
  updatePost,
  deletePost,
  getCars,
  addCar,
  deleteCar,
  getCarModels,
  addCarModel,
  deleteCarModel,
  getParts,
  addPart,
  deletePart,
  getPendingUsers,
  deletePendingUser,
  getPendingCars,
  approvePendingCar,
  deletePendingCar
} = require('../controllers/adminController');

const router = express.Router();

router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

router.get('/posts', getPosts);
router.put('/posts/:id', updatePost);
router.delete('/posts/:id', deletePost);

router.get('/cars', getCars);
router.post('/cars', addCar);
router.delete('/cars/:id', deleteCar);

router.get('/car-models', getCarModels);
router.post('/car-models', addCarModel);
router.delete('/car-models/:id', deleteCarModel);

router.get('/parts', getParts);
router.post('/parts', addPart);
router.delete('/parts/:id', deletePart);

router.get('/pending-users', getPendingUsers);
router.delete('/pending-users/:id', deletePendingUser);

router.get('/pending-cars', getPendingCars);
router.post('/pending-cars/:id/approve', approvePendingCar);
router.delete('/pending-cars/:id', deletePendingCar);

module.exports = router;
