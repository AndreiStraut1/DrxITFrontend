import axios from "axios";
import { toast } from "react-toastify";

export const handleError = (error: any) => {
  if (axios.isAxiosError(error)) {
    const { response } = error;
    if (response) {
      if (response.status === 401) {
        toast.warning("User does not exist or unauthorized");
        window.history.pushState({}, "LoginPage", "/login");
        return;
      }

      if (error.response?.status === 400) {
        const errorMessage =
          error.response.data?.message || "User already exists";
        toast.warning(errorMessage);
      }

      if (Array.isArray(response.data?.errors)) {
        response.data.errors.forEach((val: any) => {
          toast.warning(val.description);
        });
      } else if (typeof response.data?.errors === "object") {
        for (const key in response.data.errors) {
          toast.warning(response.data.errors[key][0]);
        }
      } else if (response.data) {
        toast.warning(response.data);
      }
    } else {
      toast.warning("An unknown error occurred");
    }
  } else {
    toast.warning("Non-Axios error occurred");
  }
};
