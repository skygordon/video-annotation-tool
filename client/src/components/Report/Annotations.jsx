import React, { Component } from "react";
import axios from "axios";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import Collapse from "@material-ui/core/Collapse";
import ExpandLess from "@material-ui/icons/ExpandLess";
import ExpandMore from "@material-ui/icons/ExpandMore";
import DeleteIcon from "@material-ui/icons/Delete";
import OndemandVideo from "@material-ui/icons/OndemandVideo";
import Photo from "@material-ui/icons/Photo";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import IconButton from "@material-ui/core/IconButton";
import Icon from "@material-ui/core/Icon";
import DoneAll from "@material-ui/icons/DoneAll";

import AnnotationFrame from "./AnnotationFrame.jsx";

const styles = theme => ({
  icons: {
    float: "left",
    position: "relative",
    left: "-50px"
  },
  button: {
    margin: theme.spacing()
  },
  root: {
    backgroundColor: theme.palette.background.paper,
    paddingLeft: theme.spacing(2)
  },
  listItem: {
    height: "57px"
  },
  helpIcon: {
    position: "absolute",
    top: "12px",
    right: "40px"
  },
  doneIcon: {
    position: "absolute",
    top: "12px",
    right: "175px"
  }
});

class Annotations extends Component {
  constructor(props) {
    super(props);
    this.state = {
      annotations: [],
      isLoaded: false,
      error: null
    };
  }

  componentDidMount = async () => {
    const config = {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token")
      }
    };
    try {
      let annotations = await axios.get(
        `/api/annotations?` +
        `queryConditions=${this.props.queryConditions}&` +
        `unsureOnly=${this.props.unsureOnly}&` +
        `verifiedCondition=${this.props.verifiedCondition}&` +
        `queryLimit=${this.props.queryLimit}`,
        config
      );
      this.setState({
        isLoaded: true,
        annotations: annotations.data
      });
    } catch (error) {
      console.log(error);
      console.log(JSON.parse(JSON.stringify(error)));
      if (!error.response) {
        return;
      }
      let errMsg =
        error.response.data.detail || error.response.data.message || "Error";
      console.log(errMsg);
      this.setState({
        isLoaded: true,
        error: errMsg
      });
    }
  };

  handleClick = id => {
    let annotations = JSON.parse(JSON.stringify(this.state.annotations));
    let annotation = annotations.find(annotation => annotation.id === id);
    annotation.expanded = !annotation.expanded;
    this.setState({
      annotations: annotations
    });
  };

  toggleShowVideo = (event, id) => {
    let annotations = this.state.annotations;
    let annotation = annotations.find(annotation => annotation.id === id);
    if (!annotation.expanded) {
      annotation.expanded = true;
    }
    annotation.showVideo = !annotation.showVideo;
    this.setState({
      annotations: annotations
    });
  };

  handleDelete = (event, id) => {
    event.stopPropagation();
    const config = {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("token")
      },
      data: {
        id: id
      }
    };
    axios
      .delete("/api/annotations", config)
      .then(res => {
        let annotations = JSON.parse(JSON.stringify(this.state.annotations));
        annotations = annotations.filter(annotation => annotation.id !== id);
        this.setState({
          annotations: annotations
        });
      })
      .catch(error => {
        console.log(error);
        console.log(JSON.parse(JSON.stringify(error)));
        if (!error.response) {
          return;
        }
        let errMsg =
          error.response.data.detail || error.response.data.message || "Error";
        console.log(errMsg);
        this.setState({
          isLoaded: true,
          error: errMsg
        });
      });
  };

  updateAnnotations = (id, updatedName, updatedComment, updatedUnsure) => {
    let annotations = JSON.parse(JSON.stringify(this.state.annotations));
    let annotation = annotations.find(annotation => annotation.id === id);
    annotation.name = updatedName;
    annotation.comment = updatedComment;
    annotation.unsure = updatedUnsure;
    this.setState({
      annotations: annotations
    });
  };

  render() {
    const { error, isLoaded, annotations } = this.state;
    const { classes } = this.props;
    if (!isLoaded) {
      return <List>Loading...</List>;
    }
    if (error) {
      return <List>Error: {error.message}</List>;
    }
    return (
      <React.Fragment>
        <List disablePadding className={classes.root}>
          {annotations.map(annotation => (
            <React.Fragment key={annotation.id}>
              <ListItem
                className={classes.listItem}
                button onClick={() => this.handleClick(annotation.id)}
              >
                <ListItemText
                  primary={
                    "At " +
                    Math.floor(annotation.timeinvideo / 60) +
                    " minutes " +
                    (annotation.timeinvideo % 60) +
                    " seconds Annotated: " +
                    annotation.name
                  }
                  secondary={
                    annotation.comment ? (
                      "Annotation Comment: " + annotation.comment
                    ) : ("")
                  }
                />

                <ListItemSecondaryAction>
                  {annotation.unsure ? (
                    <Icon
                      className={classes.helpIcon}
                    >
                      help
                    </Icon>
                  ) : (
                      <div/>
                    )}
                  {annotation.verifiedby ? (
                    <DoneAll
                      color="primary"
                      className={classes.doneIcon}
                    />
                  ) : (<div></div>)}
                  <IconButton
                    className={classes.icons}
                    aria-label="OndemandVideo"
                    onClick={e => this.toggleShowVideo(e, annotation.id)}
                  >
                    {annotation.showVideo ? (
                      <OndemandVideo />
                    ) : (
                        <Photo />
                      )}
                  </IconButton>
                  <IconButton
                    className={classes.icons}
                    aria-label="Delete"
                    onClick={e => this.handleDelete(e, annotation.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                  {annotation.expanded ? <ExpandLess /> : <ExpandMore />}
                </ListItemSecondaryAction>
              </ListItem>

              <Collapse in={annotation.expanded} timeout="auto" unmountOnExit>
                {annotation.showVideo ? (
                  <video
                    id="video"
                    width="800"
                    height="450"
                    src={
                      "https://cdn.deepseaannotations.com/videos/" +
                      annotation.id +
                      "_tracking.mp4"
                    }
                    type="video/mp4"
                    controls
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                    <AnnotationFrame
                      annotation={annotation}
                      updateAnnotations={this.updateAnnotations}
                    />
                  )}
              </Collapse>
            </React.Fragment>
          ))}
        </List>
      </React.Fragment>
    );
  }
}

Annotations.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(Annotations);
