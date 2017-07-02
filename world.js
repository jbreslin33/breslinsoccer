/*
    The world class

        A simple class to set the out limits of where an object can go.
*/
var World = new Class(
{
initialize: function(width,height) 
{
        this.width = width;
        this.height = height;
    } 
});
    
module.exports = World;
