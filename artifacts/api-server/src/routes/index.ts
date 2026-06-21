import { Router, type IRouter } from "express";
import healthRouter from "./health";
import patientsRouter from "./patients";
import recordsRouter from "./records";
import prescriptionsRouter from "./prescriptions";
import accessGrantsRouter from "./access-grants";
import alertsRouter from "./alerts";
import dashboardRouter from "./dashboard";
import aiRouter from "./ai";
import assistantRouter from "./assistant";

const router: IRouter = Router();

router.use(healthRouter);
router.use(patientsRouter);
router.use(recordsRouter);
router.use(prescriptionsRouter);
router.use(accessGrantsRouter);
router.use(alertsRouter);
router.use(dashboardRouter);
router.use(aiRouter);
router.use(assistantRouter);

export default router;
