import GenerateContent from './pages/GenerateContent';
import Home from './pages/Home';
import Leaderboard from './pages/Leaderboard';
import PomodoroTimer from './pages/PomodoroTimer';
import Profile from './pages/Profile';
import Quests from './pages/Quests';
import Shop from './pages/Shop';
import SprintMode from './pages/SprintMode';
import StudyAssistant from './pages/StudyAssistant';


export const PAGES = {
    "GenerateContent": GenerateContent,
    "Home": Home,
    "Leaderboard": Leaderboard,
    "PomodoroTimer": PomodoroTimer,
    "Profile": Profile,
    "Quests": Quests,
    "Shop": Shop,
    "SprintMode": SprintMode,
    "StudyAssistant": StudyAssistant,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
};