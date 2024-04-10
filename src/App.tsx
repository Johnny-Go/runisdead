import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import runisdead from "./assets/runisdead.png";
import { Image } from "./components/Image";
import { SearchBar } from "./components/SearchBar";

function App() {
  const [count, setCount] = useState(0);

  const doSearch = (searchString: string) => {
    console.log("search: " + searchString);
    fetch(`https://www.speedrun.com/api/v1/users/${searchString}`)
      .then((response) => response.json())
      .then((json) => {
        const user: string = json.data.id;
        return user;
      })
      .then((userId) => {
        console.log(userId);
      });
  };

  return (
    <>
      <div className="imagePadding">
        <Image src={runisdead} alt="Run is dead" />
      </div>
      <div>
        <SearchBar
          id="search-field"
          inputLabel="Search for Speedrun.com user"
          searchFunction={doSearch}
        />
      </div>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;
