import './App.css';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";
import DrawerButton from './components/drawer-button/drawer-button';
import { useEffect, useState } from 'react';

function App() {

  const [test, updateTests] = useState();

  useEffect(() => {
    const fetchData = async () => {
      const resp = await fetch("http://localhost:8080/tests");
      const result = await resp.json();
      updateTests(result.tests);
      console.log(tests)
    }
    fetchData();
  })


  return (
    <Router>
    <div className="App">
      <div id="nav">
      <img id="logo" src="https://cdn.marketing.dixa.com/app/uploads/2020/08/09125620/Horizontal-logo-black%402x.png" alt="logo"></img>
      <nav>
        <Link className="navButton" to="/">Tests</Link>
        <Link className="navButton" to="/runs">Runs</Link>
      </nav>
      </div>

      <div id="page">
      <Switch>
        <Route exact path="/">
          <button className="ctaButton">New test</button>
          <div id="tests">
            {JSON.stringify(tests)}
            {tests.map(test => 
              <DrawerButton className="testItem" description={test.description} name={test.name}></DrawerButton>
              )}
          </div>
        </Route>

        
        <Route path="/runs">
          <p>runs</p>
        </Route>
      </Switch>
      </div>
     
    </div>
    </Router>
  );
}

export default App;
