import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import clinicsRouter from "./clinics";
import speciesRouter from "./species";
import petsRouter from "./pets";
import visitsRouter from "./visits";
import visitItemsRouter from "./visitItems";
import dailyReportsRouter from "./dailyReports";
import productsRouter from "./products";
import vetRouter from "./vet";
import vaccinationsRouter from "./vaccinations";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/users", usersRouter);
router.use("/clinics", clinicsRouter);
router.use("/species", speciesRouter);
router.use("/pets", petsRouter);
router.use("/visits", visitsRouter);
router.use("/visit-items", visitItemsRouter);
router.use("/daily-reports", dailyReportsRouter);
router.use("/products", productsRouter);
router.use("/vet", vetRouter);
router.use("/vaccinations", vaccinationsRouter);
router.use("/admin", adminRouter);

export default router;
