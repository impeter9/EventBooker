import React from 'react';
import { BrowserRouter, Route, Redirect, Switch } from 'react-router-dom';

import AuthPage from './pages/Auth';
import BookingsPage from './pages/Bookings';
import EventsPage from './pages/Events';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Switch> {/* Switch - pick one and ignore others */}
        <Redirect from="/" to="/auth" exact /> {/* exactly '/' */}
        <Route path="/auth" component={AuthPage} />
        <Route path="/events" component={EventsPage} />
        <Route path="/bookings" component={BookingsPage} />
      </Switch>
    </BrowserRouter>
  );
}

export default App;
