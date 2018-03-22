// fix possible jquery conflicts
myjQuery = jQuery.noConflict(true);

var Debug = {
    console_logging: false,
    StyleBytype: function (type) {
        var style;

        switch (type) {
            case 'info':
                style = 'background: green; color: white;';
                break;

            case 'error':
                style = 'background: red; color: white;';
                break;

            case 'debug':
                style = 'background: black; color: white;';
                break;

            default:
                style = 'background: yellow; color: black;';
                break;
        }

        return style;
    }
};