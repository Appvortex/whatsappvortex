import React, { useState, useContext } from "react"; //, useEffect
//import { Link as RouterLink } from "react-router-dom";

import {
    TextField,
    InputAdornment,
    IconButton
} from '@material-ui/core';

import { Visibility, VisibilityOff } from '@material-ui/icons';

import './style.css';

import { i18n } from "../../translate/i18n";

import { AuthContext } from "../../context/Auth/AuthContext";

import wave from './img/wave.png';
import bg from './img/bg.svg';
import avatar from './img/logotipo.png'; //'./img/avatar.svg';

import Link from "@material-ui/core/Link";
import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";

const Copyright = () => {
    return (
        <Typography variant="body2" color="textSecondary" align="center">
            <Link
                color="inherit"
                href={process.env.REACT_APP_LANDING_PAGE_URL}
            //target="_blank"
            > {"© "} {new Date().getFullYear()} {process.env.REACT_APP_COPYRIGHT}
            </Link>{" "}
        </Typography>
    );
};

const Login = () => {
    const [user, setUser] = useState({ email: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);

    const { handleLogin } = useContext(AuthContext);

    const handleChangeInput = (e) => {
        setUser({ ...user, [e.target.name]: e.target.value });
    };

    const handlSubmit = (e) => {
        e.preventDefault();
        handleLogin(user);
    };

    return (
        <>
            {/* eslint-disable-next-line */}
            <img className="wave" src={wave} />
            <div className="container">
                {/* eslint-disable-next-line */}
                <div className="img">
                    {/* eslint-disable-next-line */}
                    <img src={bg} />
                </div>
                <div className="login-content">
                    <form noValidate onSubmit={handlSubmit}>
                        {/* eslint-disable-next-line */}
                        <img src={avatar} />
                        <TextField
                            variant="standard"
                            margin="normal"
                            color="warning"
                            required
                            fullWidth
                            id="email"
                            label={i18n.t("login.form.email")}
                            name="email"
                            value={user.email}
                            onChange={handleChangeInput}
                            autoComplete="email"
                            autoFocus
                        />
                        <TextField
                            variant="standard"
                            margin="normal"
                            color="success"
                            required
                            fullWidth
                            name="password"
                            label={i18n.t("login.form.password")}
                            id="password"
                            value={user.password}
                            onChange={handleChangeInput}
                            autoComplete="current-password"
                            type={showPassword ? 'text' : 'password'}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={() => setShowPassword((e) => !e)}
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                        <input type="submit" className="btn" value="Acessar" />
                        <Box mt={1}><Copyright /></Box>
                    </form>
                </div>
            </div>
        </>
    );
};

export default Login;
