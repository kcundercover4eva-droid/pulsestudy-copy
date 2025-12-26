import GenerateContent from './pages/GenerateContent';
import Home from './pages/Home';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import Quests from './pages/Quests';
import Shop from './pages/Shop';
import StudyAssistant from './pages/StudyAssistant';


export const PAGES = {
    "GenerateContent": GenerateContent,
    "Home": Home,
    "Leaderboard": Leaderboard,
    "Profile": Profile,
    "Quests": Quests,
    "Shop": Shop,
    "StudyAssistant": StudyAssistant,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
};