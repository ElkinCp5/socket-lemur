import React from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { socket } from "./util";

function App() {
  const ref = React.useRef<HTMLInputElement>(null);
  const [products, setProduct] = React.useState<Array<any>>([]);

  const onError = (error: any) => console.error("error:", error);
  const onSuccess = (products: any[]) => (
    setProduct(products), ref.current ? (ref.current.value = "") : null
  );

  const onAction = () => {
    socket.channel<any>("get/products", onSuccess, onError)();
  };

  function onSubmit(evt: any) {
    evt.preventDefault();
    const formData = new FormData(evt.target);
    const form: any = Object.fromEntries(formData.entries());
    socket.channel<any>(
      "post/products",
      onSuccess,
      onError
    )(
      { data: form },
      "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE3MTg2ODUyNTAsImV4cCI6MTc1MDIyMTI1MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoianJvY2tldEBleGFtcGxlLmNvbSIsImlkIjoiMTAifQ.40c99sLFuDOVY5CpQa_Rn9_2v2Zwx-WhmpmNKcIRXJc"
    );
  }

  React.useEffect(() => {
    socket.reconnect();
    onAction();
  }, []);

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <div className="card" style={{ marginBottom: 0, paddingBottom: 0 }}>
        <form onSubmit={onSubmit}>
          <div className="chat-container">
            <div className="chat-input">
              <input ref={ref} name="name" placeholder="Product name..." />
              <button type="submit">Save</button>
            </div>
          </div>
        </form>
      </div>
      <h1>Products List</h1>
      <ul className="read-the-docs" style={{ maxWidth: 590 }}>
        {products.map((p, i) => (
          <li key={i} className="tag">
            <small>ID:{p?.id}</small>
            <strong>{p?.name}</strong>
          </li>
        ))}
      </ul>
    </>
  );
}

export default App;
