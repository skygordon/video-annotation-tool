import React, { Component } from "react";
import Typography from "@material-ui/core/Typography";
import { withStyles } from "@material-ui/core/styles";
import axios from "axios";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import Swal from "sweetalert2";

const styles = {
  root: {
    height: "70vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center"
  }
};

class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: "",
      password: "",
      errorMsg: null,
      open: false //For error modal box
    };
  }

  handleChange = event => {
    this.setState({
      [event.target.name]: event.target.value
    });
  };

  handleSubmit = event => {
    event.preventDefault();
    const { username, password } = this.state;
    if (!username || !password) {
      return;
    }
    const body = {
      username: username,
      password: password
    };
    axios
      .post("/api/users/login", body, {
        headers: { "Content-Type": "application/json" }
      })
      .then(res => {
        localStorage.setItem("isAuthed", "true");
        localStorage.setItem("userid", res.data.userid);
        localStorage.setItem("username", username);
        localStorage.setItem("token", res.data.token);
        //Add code for isAdmin
        if (res.data.isAdmin) {
          localStorage.setItem("admin", res.data.isAdmin);
        }
        window.location.replace("/");
      })
      .catch(error => {
        console.log(error);
        if (error.response) {
          console.log(error.response);
          Swal.fire(error.response.data.detail, "", "error");
        }
      });
  };

  //Code for closing modal
  handleClose = () => {
    this.setState({ open: false });
  };

  render() {
    const { classes } = this.props;
    return (
      <div className={classes.root}>
        <Typography variant="h4">Login</Typography>
        <br />
        <form onSubmit={this.handleSubmit}>
          <TextField
            name="username"
            label="User Name"
            type="text"
            value={this.state.username}
            onChange={this.handleChange}
            margin="normal"
            required
          />
          <br />
          <TextField
            name="password"
            label="Password"
            type="password"
            value={this.state.password}
            onChange={this.handleChange}
            margin="normal"
            required
          />
          <br />
          <br />
          <Button type="submit" variant="contained" color="primary">
            Login
          </Button>
        </form>
      </div>
    );
  }
}

export default withStyles(styles)(Login);
