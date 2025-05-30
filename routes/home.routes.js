import { Router } from 'express';
import { Home } from '../controllers/home.controller.js';
import { isLoggedIn } from '../middlewares/checkToken.js';

const homeRouter = Router();

homeRouter.get('/home', isLoggedIn, Home );

export default homeRouter;