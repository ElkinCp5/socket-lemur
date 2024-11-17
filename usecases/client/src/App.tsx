import React from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import { socketClient } from "./util";
// import { Socket } from "socket.io-client";
import { SocketClient } from "../../../src/socketClient";
// import { SocketIO } from "./util";
import "./App.css";

function App() {
  const ref = React.useRef<HTMLInputElement>(null);
  const [client, setClient] = React.useState<SocketClient>();
  // const [socket, setSocket] = React.useState<Socket>();
  const [products, setProduct] = React.useState<Array<any>>([]);

  const onError = (error: any) => console.error("error:", error);
  const onSuccess = (products: any[]) => {
    setProduct(products);
    ref.current ? (ref.current.value = "") : null;
  };
  const postProduct = client?.channel<any>("post/products", {
    onSuccess,
    onError,
    room: "post",
  });
  const geProducts = client?.channel<any[]>("get/products", {
    onSuccess,
    onError,
  });

  function onSubmit(evt: any) {
    evt.preventDefault();
    const formData = new FormData(evt.target);
    const data: any = Object.fromEntries(formData.entries());
    // if (!client) return;
    // socket.emit("post/products", {
    //   data,
    //   params: {
    //     authorization: `Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE3MTg2ODUyNTAsImV4cCI6MTc1MDIyMTI1MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoianJvY2tldEBleGFtcGxlLmNvbSIsImlkIjoiMTAifQ.40c99sLFuDOVY5CpQa_Rn9_2v2Zwx-WhmpmNKcIRXJc`,
    //   },
    // });
    postProduct?.emit(
      { data: data, params: { room: "post" } },
      "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE3MTg2ODUyNTAsImV4cCI6MTc1MDIyMTI1MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoianJvY2tldEBleGFtcGxlLmNvbSIsImlkIjoiMTAifQ.40c99sLFuDOVY5CpQa_Rn9_2v2Zwx-WhmpmNKcIRXJc"
    );
  }

  React.useEffect(() => {
    setClient(socketClient());
    // setSocket(
    //   SocketIO(
    //     "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE3MTg2ODUyNTAsImV4cCI6MTc1MDIyMTI1MCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoianJvY2tldEBleGFtcGxlLmNvbSIsImlkIjoiMTAifQ.40c99sLFuDOVY5CpQa_Rn9_2v2Zwx-WhmpmNKcIRXJc"
    //   )
    // );
  }, []);

  // React.useEffect(() => {
  //   if (!socket) return;
  //   if (socket.connected) return;
  //   socket.connect();
  //   console.log({ status: socket.id });
  //   socket.on("get/products:success", onSuccess);
  //   socket.on("post/products:success", onSuccess);
  //   socket.emit("get/products", {});
  //   return () => {
  //     socket.off("get/products");
  //     socket.off("post/products");
  //   };
  // }, [socket]);

  React.useEffect(() => {
    if (!client) return;
    if (client.connected()) return;
    client.connect();
    console.log({ status: client.connected() });
    geProducts?.on();
    postProduct?.on();
    geProducts?.emit();
    return () => {
      geProducts?.off();
      postProduct?.off();
    };
  }, [client]);

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
