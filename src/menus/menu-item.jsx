const React = require('react');
const ReactDOM = require('react-dom');
const PureRenderMixin = require('react-addons-pure-render-mixin');
const StylePropable = require('../mixins/style-propable');
const Colors = require('../styles/colors');
const Popover = require('../popover/popover');
const CheckIcon = require('../svg-icons/navigation/check');
const ListItem = require('../lists/list-item');
const DefaultRawTheme = require('../styles/raw-themes/light-raw-theme');
const ThemeManager = require('../styles/theme-manager');
const Menu = require('./menu');

const nestedMenuStyle = {position:'relative'};
const MenuItem = React.createClass({

  mixins: [PureRenderMixin, StylePropable],

  contextTypes: {
    muiTheme: React.PropTypes.object,
  },

  propTypes: {
    checked: React.PropTypes.bool,
    desktop: React.PropTypes.bool,
    disabled: React.PropTypes.bool,
    innerDivStyle: React.PropTypes.object,
    insetChildren: React.PropTypes.bool,
    focusState: React.PropTypes.oneOf([
      'none',
      'focused',
      'keyboard-focused',
    ]),
    leftIcon: React.PropTypes.element,
    rightIcon: React.PropTypes.element,
    onTouchTap: React.PropTypes.func,
    secondaryText: React.PropTypes.node,
    style: React.PropTypes.object,
    value: React.PropTypes.string,
  },

  //for passing default theme context to children
  childContextTypes: {
    muiTheme: React.PropTypes.object,
  },

  getChildContext() {
    return {
      muiTheme: this.state.muiTheme,
    };
  },

  getInitialState() {
    return {
      muiTheme: this.context.muiTheme ? this.context.muiTheme : ThemeManager.getMuiTheme(DefaultRawTheme),
      open:false,
    };
  },

  //to update theme inside state whenever a new theme is passed down
  //from the parent / owner using context
  componentWillReceiveProps(nextProps, nextContext) {
    let newMuiTheme = nextContext.muiTheme ? nextContext.muiTheme : this.state.muiTheme;
    this.setState({muiTheme: newMuiTheme});

    if (this.state.open && nextProps.focusState === 'none') {
      this._onRequestClose();
    }
  },

  getDefaultProps() {
    return {
      focusState: 'none',
    };
  },

  componentDidMount() {
    this._applyFocusState();
  },

  componentDidUpdate() {
    this._applyFocusState();
  },

  componentWillUnmount() {
    if (this.state.open) {
      this.setState({open:false});
    }
  },

  render() {
    const {
      checked,
      children,
      desktop,
      disabled,
      focusState,
      innerDivStyle,
      insetChildren,
      leftIcon,
      menuItems,
      rightIcon,
      secondaryText,
      style,
      value,
      ...other,
    } = this.props;

    const disabledColor = this.state.muiTheme.rawTheme.palette.disabledColor;
    const textColor = this.state.muiTheme.rawTheme.palette.textColor;
    const leftIndent = desktop ? 64 : 72;
    const sidePadding = desktop ? 24 : 16;

    const styles = {
      root: {
        color: disabled ? disabledColor : textColor,
        lineHeight: desktop ? '32px' : '48px',
        fontSize: desktop ? 15 : 16,
        whiteSpace: 'nowrap',
      },

      innerDivStyle: {
        paddingLeft: leftIcon || insetChildren || checked ? leftIndent : sidePadding,
        paddingRight: sidePadding,
        paddingBottom: 0,
        paddingTop: 0,
      },

      secondaryText: {
        float: 'right',
      },

      leftIconDesktop: {
        padding: 0,
        left: 24,
        top: 4,
      },

      rightIconDesktop: {
        padding: 0,
        right: 24,
        top: 4,
        fill: Colors.grey600,
      },
    };

    let mergedRootStyles = this.mergeStyles(styles.root, style);
    let mergedInnerDivStyles = this.mergeStyles(styles.innerDivStyle, innerDivStyle);

    //Left Icon
    let leftIconElement = leftIcon ? leftIcon : checked ? <CheckIcon /> : null;
    if (leftIconElement && desktop) {
      const mergedLeftIconStyles = this.mergeStyles(styles.leftIconDesktop, leftIconElement.props.style);
      leftIconElement = React.cloneElement(leftIconElement, {style: mergedLeftIconStyles});
    }

    //Right Icon
    let rightIconElement;
    if (rightIcon) {
      const mergedRightIconStyles = desktop ?
        this.mergeStyles(styles.rightIconDesktop, rightIcon.props.style) : null;
      rightIconElement = React.cloneElement(rightIcon, {style: mergedRightIconStyles});
    }

    //Secondary Text
    let secondaryTextElement;
    if (secondaryText) {
      const secondaryTextIsAnElement = React.isValidElement(secondaryText);
      const mergedSecondaryTextStyles = secondaryTextIsAnElement ?
      this.mergeStyles(styles.secondaryText, secondaryText.props.style) : null;

      secondaryTextElement = secondaryTextIsAnElement ?
        React.cloneElement(secondaryText, {style: mergedSecondaryTextStyles}) :
        <div style={this.prepareStyles(styles.secondaryText)}>{secondaryText}</div>;
    }
    let childMenuPopover;
    if (menuItems) {
      childMenuPopover = (
        <Popover
          anchorOrigin={{horizontal:'right', vertical:'top'}}
          anchorEl={this.state.anchorEl}
          open={this.state.open}
          onRequestClose={this._onRequestClose}>
          <Menu desktop={desktop} disabled={disabled} style={nestedMenuStyle}>
            {React.Children.map(menuItems, this._cloneMenuItem)}
          </Menu>
        </Popover>
      );
      other.onTouchTap = this._onTouchTap;
    }

    return (
      <ListItem
        {...other}
        disabled={disabled}
        innerDivStyle={mergedInnerDivStyles}
        insetChildren={insetChildren}
        leftIcon={leftIconElement}
        ref="listItem"
        rightIcon={rightIconElement}
        style={mergedRootStyles}>
        {children}
        {secondaryTextElement}
        {childMenuPopover}
      </ListItem>
    );
  },

  _applyFocusState() {
    this.refs.listItem.applyFocusState(this.props.focusState);
  },

  _cloneMenuItem(item) {
    let props = {
      onTouchTap: (e) =>
      {
        this._onRequestClose();
        if (item.props.onTouchTap) {
          item.props.onTouchTap(e);
        }
        if (this.props.onTouchTap) {
          this.props.onTouchTap(e);
        }
      },
      onRequestClose: this._onRequestClose,
    };
    return React.cloneElement(item, props);
  },

  _onTouchTap(e) {
    e.preventDefault();
    this.setState({
      open:true,
      anchorEl:ReactDOM.findDOMNode(this),
    });
    if (this.props.onTouchTap) {
      this.props.onTouchTap(e);
    }
  },

  _onRequestClose() {
    if (!this.isMounted()) {
      return;
    }
    this.setState({
      open:false,
      anchorEl:null,
    });
  },
});

module.exports = MenuItem;
