import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from "react-router-dom";
import routes from './routes';
// import "react-toastify/dist/ReactToastify.css";
// import { ToastContainer } from "react-toastify";
// import { Provider } from 'react-redux';
// import { store } from './Redux/store';
import { Toaster } from "react-hot-toast";
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* <Provider store={store}>
    <ToastContainer /> */}
    <Toaster position="top-right" />
    <RouterProvider router={routes} />
    {/* </Provider> */}
  </StrictMode>,
)