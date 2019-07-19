import React, { Component } from "react";
import axios from "axios";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";

import VerifySelection from "./VerifySelection.jsx";
import VerifyAnnotations from "./VerifyAnnotations.jsx";
import { Button, Typography } from "@material-ui/core";

const styles = theme => ({
  button: {
    margin: theme.spacing()
  },
  resetContainer: {
    padding: theme.spacing(3)
  },
  list: {
    width: "100%",
    backgroundColor: theme.palette.background.paper
  },
  item: {
    display: "inline",
    paddingTop: 0,
    width: "1300px",
    height: "730px",
    paddingLeft: 0
  },
  img: {
    padding: theme.spacing(3),
    width: "1280px",
    height: "720px"
  },
  container: {
    display: "grid",
    gridTemplateColumns: "repeat(12, 1fr)",
    gridGap: theme.spacing(3)
  },
  paper: {
    padding: theme.spacing(5)
  }
});

class Verify extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectionMounted: true,
      /* -1 represents select all */
      selectedUsers: [],
      selectedVideos: [],
      selectedConcepts: [],
      selectedUnsure: false,
      selectedTrackingFirst: false,
      annotations: [],
      error: null,
      index: 0
    };
  }

  toggleSelection = async () => {
    let annotations = [];
    if (!this.state.selectionMounted) {
      this.resetState(this.setState({
        selectionMounted: !this.state.selectionMounted,
        noAnnotations: false
      }))
    } else {
      annotations = await this.getAnnotations();
      if (annotations.length < 1){
        this.setState({
          noAnnotations: true,
          selectionMounted: !this.state.selectionMounted
        })
      } else {
        this.setState({
          annotations: annotations,
          selectionMounted: !this.state.selectionMounted
        });
      }
    }
  };

  getUsers = async () => {
    return axios
      .get(`/api/users?noAi=true`, {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") }
      })
      .then(res => res.data)
      .catch(error => {
        console.log(error);
        this.setState({
          error: error
        });
      });
  };

  getVideos = async () => {
    return axios
      .get(`/api/annotations/verified`, {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
        params: {
          verifiedOnly: "-1",
          selectedUsers: this.state.selectedUsers
        }
      })
      .then(res => res.data)
      .catch(error => {
        this.setState({
          error: error
        });
      });
  };

  getVideoCollections = async () => {
    return axios
      .get(`/api/collections/videos`, {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") }
      })
      .then(res => res.data)
      .catch(error => {
        this.setState({
          error: error
        });
      });
  };

  getConcepts = async () => {
    return axios
      .get(`/api/annotations/verified`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("token")
        },
        params: {
          verifiedOnly: "-1",
          selectedUsers: this.state.selectedUsers,
          selectedVideos: this.state.selectedVideos
        }
      })
      .then(res => res.data)
      .catch(error => {
        this.setState({
          error: error
        });
      });
  };

  getUnsure = async () => {
    return axios
      .get(`/api/annotations/verified`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("token")
        },
        params: {
          verifiedOnly: "-1",
          selectedUsers: this.state.selectedUsers,
          selectedVideos: this.state.selectedVideos,
          selectedConcepts: this.state.selectedConcepts
        }
      })
      .then(res => res.data)
      .catch(error => {
        this.setState({
          error: error
        });
      });
  };

  getAnnotations = async () => {
    return axios
      .get(`/api/annotations/verified`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("token")
        },
        params: {
          verifiedOnly: this.state.selectedTrackingFirst ? "1" : "-1",
          selectedUsers: this.state.selectedUsers,
          selectedVideos: this.state.selectedVideos,
          selectedConcepts: this.state.selectedConcepts,
          selectedUnsure: this.state.selectedUnsure,
          selectedTrackingFirst: this.state.selectedTrackingFirst
        }
      })
      .then(res => res.data)
      .catch(error => {
        this.setState({
          error: error
        });
      });
  };

  selectUser = user => {
    this.setState({
      selectedUsers: this.state.selectedUsers.concat(user)
    });
  };

  handleChange = type => value => {
    this.setState({
      [type]: value
    });
  };

  handleChangeSwitch = type => event => {
    this.setState({
      [type]: event.target.checked
    });
  };

  handleChangeList = type => event => {
    if (!this.state[type].includes(event.target.value)) {
      if (event.target.value === "-1") {
        this.setState({
          [type]: ["-1"]
        });
      } else {
        if (this.state[type][0] === "-1") {
          this.setState({
            [type]: [event.target.value]
          });
        } else {
          this.setState({
            [type]: this.state[type].concat(event.target.value)
          });
        }
      }
    } else {
      this.setState({
        [type]: this.state[type].filter(typeid => typeid !== event.target.value)
      });
    }
  };

  resetStep = step => {
    switch (step) {
      case 0:
        this.setState({
          selectedUsers: []
        });
        return;
      case 1:
        this.setState({
          selectedVideos: []
        });
        return;
      case 2:
        this.setState({
          selectedConcepts: []
        });
        return;
      case 3:
        this.setState({
          selectedUnsure: false,
          selectedTrackingFirst: false
        });
        return;
      default:
        return;
    }
  };

  resetState = (callback) => {
    this.setState({
      selectedUsers: [],
      selectedVideos: [],
      selectedConcepts: [],
      selectedUnsure: false,
      selectedTrackingFirst: false,
      index: 0
    },
    callback
    );
  };

  handleNext = callback => {
    this.setState(
      {
        index: this.state.index + 1
      },
      callback
    );
  };

  render() {
    let selection = "";
    if (this.state.selectionMounted) {
      selection = (
        <VerifySelection
          selectedUsers={this.state.selectedUsers}
          selectedVideos={this.state.selectedVideos}
          selectedConcepts={this.state.selectedConcepts}
          selectedUnsure={this.state.selectedUnsure}
          selectedTrackingFirst={this.state.selectedTrackingFirst}
          getUsers={this.getUsers}
          getVideos={this.getVideos}
          getVideoCollections={this.getVideoCollections}
          getConcepts={this.getConcepts}
          getUnsure={this.getUnsure}
          handleChangeSwitch={this.handleChangeSwitch}
          handleChange={this.handleChange}
          handleChangeList={this.handleChangeList}
          resetStep={this.resetStep}
          resetState={this.resetState}
          toggleSelection={this.toggleSelection}
          selectUser={this.selectUser}
        />
      );
    } else if (this.state.noAnnotations){
      selection = (
        <Paper
        square
        elevation={0}
        className={this.props.classes.resetContainer}
        >
          <Typography>
          All Tracking Videos Verified
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => this.resetState(this.setState({
              selectionMounted: !this.state.selectionMounted,
              noAnnotations: false
            }))}
          >
            Reset
          </Button>
        </Paper>
      )
    } else {
      selection = (
        <Paper
          square
          elevation={0}
          className={this.props.classes.resetContainer}
        >
          <VerifyAnnotations
            annotation={this.state.annotations[this.state.index]}
            index={this.state.index}
            handleNext={this.handleNext}
            toggleSelection={this.toggleSelection}
            size={this.state.annotations.length}
            tracking={this.state.selectedTrackingFirst}
          />
        </Paper>
      );
    }

    return <React.Fragment>{selection}</React.Fragment>;
  }
}

Verify.propTypes = {
  classes: PropTypes.object
};

export default withStyles(styles)(Verify);
