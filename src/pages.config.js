import GenerateContent from './pages/GenerateContent';
import Leaderboard from './pages/Leaderboard';
import PomodoroTimer from './pages/PomodoroTimer';
import Profile from './pages/Profile';
import Quests from './pages/Quests';
import Shop from './pages/Shop';
import SprintMode from './pages/SprintMode';
import StudyAssistant from './pages/StudyAssistant';
import Home from './pages/Home';


export const PAGES = {
    "GenerateContent": GenerateContent,
    "Leaderboard": Leaderboard,
    "PomodoroTimer": PomodoroTimer,
    "Profile": Profile,
    "Quests": Quests,
    "Shop": Shop,
    "SprintMode": SprintMode,
    "StudyAssistant": StudyAssistant,
    "Home": Home,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
};