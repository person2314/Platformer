var Vector2 = function (nx, ny)
{
	this.x = nx;
	this.y = ny;
}

Vector2.prototype.set = function (nx, ny)
{
	this.x = nx;
	this.y = ny;
}

Vector2.prototype.Magnitude = function ()
{
	var mag = this.x * this.x + this.y * this.y;
	mag = Math.sqrt(mag);
	return mag;
}

Vector2.prototype.Normalize = function ()
{
	var mag = this.Magnitude();
	this.x = this.x / mag;
	this.y = this.y / mag;
}

Vector2.prototype.GetNormal = function ()
{
	var mag = this.Magnitude();
	var v2 = new Vector2(0, 0);

	v2.x = this.x / mag;
	v2.y = this.y / mag;

	return v2;
}

Vector2.prototype.Add = function (other)
{
	this.x += other.x;
	this.y += other.y;
}

Vector2.prototype.Subtract = function (other)
{
	this.x -= other.x;
	this.y -= other.y;
}

Vector2.prototype.Multiply = function(scaler)
{
	this.x *= scaler;
	this.y *= scaler;
}

Vector2.prototype.Divide = function (scaler)
{
	this.x /= scaler;
	this.y /= scaler;
}