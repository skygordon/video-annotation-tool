import React, { Component } from "react";
import axios from "axios";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import ListItem from "@material-ui/core/ListItem";

import ConceptsSelected from "../Utilities/ConceptsSelected.jsx";
import DialogModal from "../Utilities/DialogModal.jsx";

const styles = theme => ({
  item: {
    display: "inline",
    paddingTop: 0,
    width: "1300px",
    height: "730px",
    paddingLeft: 0
  },
  img: {
    width: "1280px",
    height: "720px"
  }
});

class AnnotationFrame extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      dialogMsg: null,
      dialogOpen: false,
      clickedConcept: null,
    };
  }

  editAnnotation = (comment, unsure) => {
    const body = {
      op: "verifyAnnotation",
      conceptId: this.state.clickedConcept.id,
      oldConceptId: this.props.annotation.conceptId,
      conceptName: this.state.clickedConcept.name,
      comment: comment,
      unsure: unsure,
      id: this.props.annotation.id,
    };
    const config = {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token")
      }
    };
    axios
      .patch("/api/annotations", body, config)
      .then(res => {
        this.handleDialogClose();
        this.props.updateAnnotations(
          this.state.clickedConcept.id,
          this.state.clickedConcept.name,
          comment,
          unsure
        );
      })
      .catch(error => {
        this.handleDialogClose();
        console.log(error);
        if (error.response) {
          console.log(error.response.data.detail);
        }
      });
  };

  handleDialogClose = () => {
    this.setState({
      dialogOpen: false,
      dialogMsg: null,
      clickedConcept: null
    });
  };

  handleConceptClick = concept => {
    this.setState({
      dialogMsg:
        "Switch " + this.props.annotation.name + " to " + concept.name + "?",
      dialogOpen: true,
      clickedConcept: concept,
    });
  };

  render() {
    const {
      error,
      dialogMsg,
      dialogOpen
    } = this.state;
    const { classes } = this.props;
    const { unsure, comment, imagewithbox } = this.props.annotation;
    if (error) {
      return <div>Error: {error}</div>;
    }
    return (
      <React.Fragment>
        <DialogModal
          title={"Confirm Annotation Edit"}
          message={dialogMsg}
          comment={comment}
          unsure={unsure}
          placeholder={"Comments"}
          inputHandler={this.editAnnotation}
          open={dialogOpen}
          handleClose={this.handleDialogClose}
        />
        <ConceptsSelected handleConceptClick={this.handleConceptClick} />
        <ListItem className={classes.item}>
          <img
            className={classes.img}
            id="imageId"
            src={
              "https://cdn.deepseaannotations.com/test/" + imagewithbox
            }
            alt="error"
          />
        </ListItem>
      </React.Fragment>
    );
  }
}

AnnotationFrame.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(AnnotationFrame);
