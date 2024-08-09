export function keyDownHandler(e) {
  if (e.key === "W" || e.key === "w") {
    upPressed = true;
  } else if (e.key === "S" || e.key === "s") {
    downPressed = true;
  }
}

export function keyUpHandler(e) {
  if (e.key === "w" || e.key === "W") {
    upPressed = false;
  } else if (e.key === "s" || e.key === "S") {
    downPressed = false;
  }
}