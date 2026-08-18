import { Router } from "express";
import { AiController } from "../controllers/aiController";

const router = Router();
const controller = new AiController();

router.post("/api/flashcards", controller.generateFlashcards);
router.post("/ai/flashcards", controller.generateFlashcards);
router.post("/api/quizzes", controller.generateQuiz);
router.post("/ai/quizzes", controller.generateQuiz);
router.post("/api/concepts/explain", controller.explainConcept);
router.post("/ai/concepts/explain", controller.explainConcept);
router.post("/api/roadmaps", controller.generateRoadmap);
router.post("/ai/roadmaps", controller.generateRoadmap);
router.post("/api/daily-fact", controller.generateDailyFact);
router.post("/ai/daily-fact", controller.generateDailyFact);
router.post("/api/chat", controller.chat);
router.post("/ai/chat", controller.chat);
router.post("/api/interview/questions", controller.generateInterviewQuestions);
router.post("/ai/interview/questions", controller.generateInterviewQuestions);
router.post("/api/interview/answers", controller.submitInterviewAnswer);
router.post("/ai/interview/answers", controller.submitInterviewAnswer);

export default router;
