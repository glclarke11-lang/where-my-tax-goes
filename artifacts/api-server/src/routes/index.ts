import { Router, type IRouter } from "express";
import healthRouter from "./health";
import taxRouter from "./tax";
import lifetimeRouter from "./lifetime";
import nationalBudgetRouter from "./national-budget";
import sentimentRouter from "./sentiment";

const router: IRouter = Router();

router.use(healthRouter);
router.use(taxRouter);
router.use(lifetimeRouter);
router.use(nationalBudgetRouter);
router.use(sentimentRouter);

export default router;
