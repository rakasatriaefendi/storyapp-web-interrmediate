import HomePage from '../pages/home/home-page';
import AboutPage from '../pages/about/about-page';
import MapPage from '../pages/map/map-page';
import AddStoryPage from '../pages/add-story/add-story-page';
import LoginPage from '../pages/login/login-page';
import RegisterPage from "../pages/register/register-page.js";
import SavedStoriesPage from '../pages/saved-stories/saved-stories-page.js';

const routes = {
  '/': new HomePage(),
  '/about': new AboutPage(),
  '/map': new MapPage(),
  '/add-story': new AddStoryPage(),
  '/login': new LoginPage(),
  '/register': new RegisterPage(),
  '/saved-stories': new SavedStoriesPage(),
};

export default routes;