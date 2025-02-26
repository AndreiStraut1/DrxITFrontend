import { createContext, useEffect, useState } from "react";
import { UserProfile } from "../models/User";
import { useNavigate } from "react-router-dom";
import { loginAPI, registerAPI } from "../services/AuthService";
import { toast } from "react-toastify";
import React from "react";
import axios from "axios";

type UserContextType = {
  user: UserProfile | null;
  accessToken: string | null;
  registerUser: (email: string, username: string, password: string) => void;
  loginUser: (username: string, password: string) => void;
  logout: () => void;
  isLoggedIn: () => boolean;
};

type Props = { children: React.ReactNode };

const UserContext = createContext<UserContextType>({} as UserContextType);

export const UserProvider = ({ children }: Props) => {
  const navigate = useNavigate();
  const [accessToken, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("user");
    const token = localStorage.getItem("accessToken");
    if (user && token) {
      setUser(JSON.parse(user));
      setToken(token);
      axios.defaults.headers.common["Authorization"] = "Bearer " + token;
    }
    setIsReady(true);
  }, []);

  const registerUser = async (
    email: string,
    username: string,
    password: string
  ) => {
    try {
      await registerAPI(email, username, password).then((res) => {
        if (res) {
          localStorage.setItem("token", res?.data.accessToken);
          const userObj = {
            username: res?.data.username,
            email: res?.data.email,
            roles: res?.data.roles,
          };
          localStorage.setItem("user", JSON.stringify(userObj));
          setToken(res?.data.accessToken!);
          setUser(userObj!);
          toast.success("User created successfully!");
          navigate("/login");
        }
      });
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          toast.warning("User does not exist");
        } else {
          toast.warning("Server error occured");
        }
      } else {
        toast.warning("An unexpected error occurred");
      }
    }
  };

  const loginUser = async (username: string, password: string) => {
    try {
      const res = await loginAPI(username, password);
      if (res) {
        localStorage.setItem("accessToken", res.data.accessToken);
        const userObj = {
          username: res.data.username,
          email: res.data.email,
          // Ensure roles is an array: if it's not an array, wrap it in one
          roles: Array.isArray(res.data.roles)
            ? res.data.roles
            : [res.data.roles || ""],
        };
        localStorage.setItem("user", JSON.stringify(userObj));
        setToken(res.data.accessToken);
        setUser(userObj);
        toast.success("Login Success!");
        navigate("/home");
      }
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          toast.warning("User does not exist");
        } else {
          toast.warning("Server error occured");
        }
      } else {
        toast.warning("An unexpected error occurred");
      }
    }
  };

  const isLoggedIn = () => {
    return !!user;
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    setUser(null);
    setToken("");
    navigate("/");
  };

  return (
    <UserContext.Provider
      value={{ loginUser, user, accessToken, logout, isLoggedIn, registerUser }}
    >
      {isReady ? children : null}
    </UserContext.Provider>
  );
};

export const useAuth = () => React.useContext(UserContext);
