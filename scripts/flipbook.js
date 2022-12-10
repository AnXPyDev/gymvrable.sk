{
/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("flipbook-canvas");

/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext("2d");

class Vector2 {
  constructor(x = 0, y = x) {
    this.x = x;
    this.y = y;
  }
  copy() {
    return V2(this.x, this.y);
  }
}

function V2(x, y) {
  return new Vector2(x, y);
}

function lerp(a, b, m, e = 0.01) {
  let r = a + (b - a) * m;
  if (Math.abs(b - r) < e) {
    return b;
  }
  return r;
}

function v2lerp(a, b, m, e) {
  return V2(lerp(a.x, b.x, m, e), lerp(a.y, b.y, m, e));
}

function v2dist(a, b) {
  return Math.sqrt(Math.pow(b.x - a.x, 2), Math.pow(b.y - a.y, 2));
}

function unlerp(a, b, x) {
  return (x - a) / (b - a);
}

function clamp(a, min, max) {
  if (a < min) {
    return min;
  } else if (a > max) {
    return max;
  }
  return a;
}

class Entity {
  constructor() {
    this.position = V2();
    this.size = V2();
    this.depth = 0;
    this.mdepth = 0;
    this.parentslide = null;
    this.animations = [];
  }

  tick() {}
  draw(ctx) {}
  mouse_down(mpos) {}
  mouse_up(mpos) {}
  check_mouse(mpos) {
    if (mpos.x >= this.position.x - this.size.x / 2
      && mpos.x <= this.position.x + this.size.x / 2
      && mpos.y >= this.position.y - this.size.y / 2
      && mpos.y <= this.position.y + this.size.y / 2) {
      return true;
    }
    return false;
  }
  mouse_hover(mpos) {}
  on_deactivate() {}
  on_activate() {}
}

class ImageEnt extends Entity {
  constructor(sprite, parent, config = {}) {
    super();

    this.parentslide = parent;
    this.sprite = sprite;
  

    this.size = config.size && config.size.copy() || V2(100);
    if (config.lockImageRatio) {
      if (config.width != undefined) {
        this.size.x = config.width;
        this.size.y = (this.size.x / sprite.size.x) * sprite.size.y;
      } else if (config.height != undefined) {
        this.size.y = config.height;
        this.size.x = (this.size.y / sprite.size.y) * sprite.size.x;
      } else {
        this.size.y = (this.size.x / sprite.size.x) * sprite.size.y;
      }
    }

    this.position = config.position && config.position.copy() || V2();
    if (config.leftCornerPos) {
      this.position.x += this.size.x / 2;
      this.position.y += this.size.y / 2;
    }

    if (config.leftCanvasPos && this.parentslide != undefined) {
      this.position.x -= parent.canvasSize.x / 2;
      this.position.y -= parent.canvasSize.y / 2;
    }

    this.rotation = config.rotation || 0;
    
    this.activate_animation = config.activateAnimation;
    this.activate_animation && this.activate_animation.init(this);

    this.hover_animation = config.hoverAnimation;
    this.hover_animation && this.hover_animation.init(this);

    this.unhover_animation = config.unhoverAnimation;
    this.unhover_animation && this.unhover_animation.init(this);

    this.hovered_over = false;
    this.hover_to_top = config.hoverToTop || this.hover_animation && true;

    this.top_depth = config.topDepth || 1000;
    this.top_mdepth = config.topMdepth || 1000;

    this.default_position = this.position.copy();
    this.default_size = this.size.copy();

    this.activate_delay = config.activateDelay || 0;
    this.current_delay = this.activate_delay;

    this.shadow_draw = config.shadowDraw || false;
    this.shadow_blur = config.shadowBlur || 10;
    this.shadow_color = config.shadowColor || "#00000055";

    this.outline_width = config.outlineWidth || 0;
    this.outline_color = config.outlineColor;

    this.link = config.link;
    this.callback = config.callback || this.link && (() => window.open(this.link)) || function() {};

    this.depth = config.depth || 0;
    this.mdepth = config.mdepth || this.depth;

    this.default_depth = this.depth;
    this.default_mdepth = this.mdepth;
  }

  on_activate() {

    this.current_delay = this.activate_delay;
    this.activate_animation && this.activate_animation.start();
    this.sprite.upgrade();
  }

  tick() {
    if (this.current_delay > 0) {
      this.current_delay -= 1;
      return;
    }

    this.activate_animation && this.activate_animation.update();
    this.hover_animation && this.hover_animation.update();
    this.unhover_animation && this.unhover_animation.update();
  }

  draw(ctx) {

    if (this.size.x == 0 && this.size.y == 0) {
      return;
    }

    ctx.save();

    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.rotation);

    if (this.outline_color) {
      ctx.save();
      if (this.shadow_draw) {
        ctx.shadowBlur = this.shadow_blur;
        ctx.shadowColor = this.shadow_color;
      }
      ctx.fillStyle = this.outline_color;
      ctx.fillRect(-this.size.x / 2 - this.outline_width, -this.size.y / 2 - this.outline_width, this.size.x + 2*this.outline_width, this.size.y + 2*this.outline_width);
      ctx.restore();
    } else {
      if (this.shadow_draw) {
        ctx.shadowBlur = this.shadow_blur;
        ctx.shadowColor = this.shadow_color;
      }
    }

    ctx.drawImage(this.sprite.image, -this.size.x / 2, -this.size.y /2, this.size.x, this.size.y);

    ctx.restore();
  }

  mouse_down(mpos) {
    if (this.check_mouse(mpos)) {
      this.callback();
    }
  }

  mouse_hover(mpos) {
    if (this.check_mouse(mpos)) {
      if (!this.hovered_over) {
        this.unhover_animation && this.unhover_animation.stop();
        this.hover_animation && this.hover_animation.start();
        if (this.hover_to_top) {
          this.depth = this.top_depth;
          this.mdepth = this.top_mdepth;
        }
      }
      this.hovered_over = true;
    } else {
      if (this.hovered_over) {
        this.hover_animation && this.hover_animation.stop();
        this.unhover_animation && this.unhover_animation.start();
        if (this.hover_to_top) {
          this.depth = this.default_depth;
          this.mdepth = this.default_mdepth;
        }
      }
      this.hovered_over = false;
    }
    //return this.hovered_over;
  }
}

class Animation {
  constructor() {
    this.active = false;
  }
  init(entity) {
    this.entity = entity;
  }
  start() {
    this.active = true;
  }
  stop() {
    this.active = false;
  }
  update() {
    if (this.active) {
      this.tick();
    }
  }
  tick() {}
}

class MoveAnimation extends Animation {
  constructor(from, to) {
    super();
    this.from = from;
    this.to = to;
  }

  start() {
    this.active = true;
    this.entity.position = this.from.copy();
  }
}

class MoveLerpAnimation extends MoveAnimation {
  constructor(from, to, magnitude) {
    super(from, to);
    this.magnitude = magnitude;
  }
  tick() {
    this.entity.position.x = lerp(this.entity.position.x, this.to.x, this.magnitude);
    this.entity.position.y = lerp(this.entity.position.y, this.to.y, this.magnitude);
    if (Math.abs(this.entity.position.x - this.to.x) < 0.5 && Math.abs(this.entity.position.y - this.to.y) < 0.5) {
      this.active = false;
    }
  }
}

class SlideInAnimation extends Animation {
  constructor(side = "left") {
    super();
    this.side = side;
  }
  start() {
    this.active = true;
    this.target_position = this.entity.default_position.copy();
    if (this.side == "left") {
      this.entity.position = V2(
        -this.entity.parentslide.canvasSize.x / 2 - this.entity.default_size.x,
        this.target_position.y
      );
    } else if (this.side == "right") {
      this.entity.position = V2(
        this.entity.parentslide.canvasSize.x / 2 + this.entity.default_size.x,
        this.target_position.y
      );
    } else if (this.side == "up") {
      this.entity.position = V2(
        this.target_position.x,
        -this.entity.parentslide.canvasSize.y / 2 - this.entity.default_size.y,
      );
    } else if (this.side == "down") {
      this.entity.position = V2(
        this.target_position.x,
        this.entity.parentslide.canvasSize.y / 2 + this.entity.default_size.y,
      );
    }
    
  }
  stop() {
    this.active = false;
  }
}

class SlideOutAnimation extends Animation {
  constructor(side = "left") {
    super();
    this.side = side;
  }
  start() {
    this.active = true;
    if (this.side == "left") {
      this.target_position = V2(
        -this.entity.parentslide.canvasSize.x / 2 - this.entity.default_size.x,
        this.entity.position.y
      );
    } else if (this.side == "right") {
      this.target_position = V2(
        this.entity.parentslide.canvasSize.x / 2 + this.entity.default_size.x,
        this.entity.position.y
      );
    } else if (this.side == "up") {
      this.target_position = V2(
        this.entity.position.x,
        -this.entity.parentslide.canvasSize.y / 2 - this.entity.default_size.y,
      );
    } else if (this.side == "down") {
      this.target_position = V2(
        this.entity.position.x,
        this.entity.parentslide.canvasSize.y / 2 + this.entity.default_size.y,
      );
    }
    
  }
  stop() {
    this.active = false;
  }
}

class SlideOutLerpAnimation extends SlideOutAnimation {
  constructor(side, magnitude = 0.5) {
    super(side);
    this.magnitude = magnitude;
  }

  tick() {
    this.entity.position.x = lerp(this.entity.position.x, this.target_position.x, this.magnitude);
    this.entity.position.y = lerp(this.entity.position.y, this.target_position.y, this.magnitude);
    if (this.entity.position.x == this.target_position.x && this.entity.position.y == this.target_position.y) {
      this.active = false;
    }
  }
}

class SlideInLerpAnimation extends SlideInAnimation {
  constructor(side, magnitude = 0.5) {
    super(side);
    this.magnitude = magnitude;
  }

  tick() {
    this.entity.position.x = lerp(this.entity.position.x, this.target_position.x, this.magnitude);
    this.entity.position.y = lerp(this.entity.position.y, this.target_position.y, this.magnitude);
    if (this.entity.position.x == this.target_position.x && this.entity.position.y == this.target_position.y) {
      this.active = false;
    }
  }
}

class EnlargeAnimation extends Animation {
  constructor(from, to = 1.2) {
    super();
    this.from = from;
    this.to = to;
  }
  start() {
    this.active = true;
    if (this.from != undefined) {
      this.entity.size.x = this.entity.default_size.x * this.from;
      this.entity.size.y = this.entity.default_size.y * this.from;
    }
    this.target_size = V2(this.entity.default_size.x * this.to, this.entity.default_size.y * this.to);
  }
}

class EnlargeLerpAnimation extends EnlargeAnimation {
  constructor(from, to, magnitude) {
    super(from, to);
    this.magnitude = magnitude;
  }

  tick() {
    this.entity.size.x = lerp(this.entity.size.x, this.target_size.x, this.magnitude);
    this.entity.size.y = lerp(this.entity.size.y, this.target_size.y, this.magnitude);
    if (this.entity.size.x == this.target_size.x && this.entity.size.y == this.target_size.y) {
      this.active = false;
    }
  }
}

class CompoundAnimation extends Animation {
  constructor(animations) {
    super();
    this.animations = animations;
  }
  init(entity) {
    for (let i = 0; i < this.animations.length; i++) {
      this.animations[i].init(entity);
    }
  }
  start() {
    this.active = true;
    for (let i = 0; i < this.animations.length; i++) {
      this.animations[i].start();
    }
  }
  tick() {
    let finished = true;
    for (let i = 0; i < this.animations.length; i++) {
      this.animations[i].update();
      if (this.animations[i].active) {
        finished = false;
      }
    }
    this.active = !finished;
  }
}

class SolidBackground extends Entity {
  constructor(color = "#FFAA55", depth = -100) {
    super();
    this.color = color;
    this.depth = depth;
  }
  draw(ctx) {
    ctx.save();
    ctx.fillStyle = this.color;
    
    ctx.fillRect(-this.parentslide.canvasSize.x / 2, -this.parentslide.canvasSize.y / 2, this.parentslide.canvasSize.x , this.parentslide.canvasSize.y);

    ctx.restore();
  }
}

class Slide {
  constructor(config) {

    this.position = config.position && config.position.copy() || V2();
    this.size = config.size && config.size.copy() || V2(canvas.width, canvas.height);
    this.canvasSize = config.canvasSize && config.canvasSize.copy() || this.size.copy();
 
    this.activate_delay = config.activateDelay || 0;
    this.current_delay = 0;

    this.depth = config.depth || 0;
    


    this.next_activate_animation = config.nextActivateAnimation;
    this.next_activate_animation && this.next_activate_animation.init(this);

    this.next_deactivate_animation = config.nextDeactivateAnimation;
    this.next_deactivate_animation && this.next_deactivate_animation.init(this);

    this.prev_activate_animation = config.prevActivateAnimation;
    this.prev_activate_animation && this.prev_activate_animation.init(this);

    this.prev_deactivate_animation = config.prevDeactivateAnimation;
    this.prev_deactivate_animation && this.prev_deactivate_animation.init(this);

    this.activate_animation = this.next_activate_animation;
    this.deactivate_animation = this.next_deactivate_animation;

    this.entities = [];
    this.backgrounds = [];

    this.default_position = this.position.copy();
    this.default_size = this.size.copy();

    this.position = V2(10000);

    this.canvas = document.createElement("canvas");
    this.canvas.width = this.canvasSize.x;
    this.canvas.height = this.canvasSize.y;
    this.ctx = this.canvas.getContext("2d");
    this.parentslide = env.masterSlide;
    this.entities_activated = false;
  }

  on_activate(dir) {
    this.current_delay = this.activate_delay;
    this.entities_activated = false;
    if (dir == "next") {
      this.activate_animation = this.next_activate_animation;
      this.deactivate_animation = this.next_deactivate_animation;
    } else if (dir == "prev") {
      this.activate_animation = this.prev_activate_animation;
      this.deactivate_animation = this.prev_deactivate_animation;
    }

    this.activate_animation && this.activate_animation.start();
    this.deactivate_animation && this.deactivate_animation.stop();

    if (!this.activate_animation) {
      this.position = V2(10000);
    }
  }

  activate_entities() {
    for (let i = 0; i < this.entities.length; i++) {
      this.entities[i].on_activate();
    }
  }

  on_deactivate(dir) {
    for (let i = 0; i < this.entities.length; i++) {
      this.entities[i].on_deactivate();
    }
    if (dir == "next") {
      this.activate_animation = this.next_activate_animation;
      this.deactivate_animation = this.next_deactivate_animation;
    } else if (dir == "prev") {
      this.activate_animation = this.prev_activate_animation;
      this.deactivate_animation = this.prev_deactivate_animation;
    }
    this.activate_animation && this.activate_animation.stop();
    this.deactivate_animation && this.deactivate_animation.start();
    if (!this.deactivate_animation) {
      this.position = V2(10000);
    }
  }

  add_entity(entity) {
    entity.parentslide = this;
    this.entities.push(entity);
  }

  add_background(entity) {
    entity.parentslide = this;
    this.backgrounds.push(entity);
  }

  tick() {
    if (this.current_delay > 0) {
      this.current_delay -= 1;  
    } else {
      if (!this.entities_activated) {
        this.activate_entities();
        this.entities_activated = true;
      }
    }

    this.weak_tick();
    for (let i = 0; i < this.entities.length; i++) {
      this.entities[i].tick();
    }
  }
  weak_tick() {
    this.activate_animation && this.activate_animation.update();
    this.deactivate_animation && this.deactivate_animation.update();
  }

  weak_draw(ctx) {

	  if ( this.deactivate_animation.active == false ) {
		  return;
	  }

	  ctx.save();

	  ctx.shadowColor = "#00000055";
	  ctx.shadowBlur = 30;

	  ctx.translate(this.position.x, this.position.y);
	  ctx.drawImage(this.canvas, -this.size.x / 2, -this.size.y / 2, this.size.x, this.size.y);
	  ctx.restore();
  }

  draw(ctx) {
    this.ctx.clearRect(0,0, this.canvas.width, this.canvas.height);
    this.ctx.save();


    this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);

    for (let i = 0; i < this.backgrounds.length; i++) {
      this.backgrounds[i].draw(this.ctx);
    }

    if (this.entities_activated) {
      this.entities.sort(function(a, b) {
        if (a.depth < b.depth) {
          return -1;
        } else if (a.depth > b.depth) {
          return 1;
        }
      });

      for (let i = 0; i < this.entities.length; i++) {
        this.entities[i].draw(this.ctx);
      }
    }

    this.ctx.restore();

    ctx.save();

    ctx.shadowColor = "#00000055";
    ctx.shadowBlur = 30;

    ctx.translate(this.position.x, this.position.y);
    ctx.drawImage(this.canvas, -this.size.x / 2, -this.size.y / 2, this.size.x, this.size.y);
    ctx.restore();

  }

  get_mpos(mpos) {
    return V2(((mpos.x - this.position.x) / (this.size.x / 2)) * (this.canvasSize.x / 2), ((mpos.y - this.position.y) / (this.size.y / 2)) * (this.canvasSize.y / 2))
  }

  mouse_down(mpos) {
    mpos = this.get_mpos(mpos);
    this.entities.sort(function(a, b) {
      if (a.mdepth > b.mdepth) {
        return -1;
      } else if (a.mdepth < b.mdepth) {
        return 1;
      }
    });

    for (let i = 0; i < this.entities.length; i++) {
      if (this.entities[i].mouse_down(V2(mpos.x - this.position.x, mpos.y - this.position.y))) {
        break;
      }
    }
  }

  mouse_hover(mpos) {
    mpos = this.get_mpos(mpos);
    this.entities.sort(function(a, b) {
      if (a.mdepth < b.mdepth) {
        return -1;
      } else if (a.mdepth > b.mdepth) {
        return 1;
      }
    });

    for (let i = 0; i < this.entities.length; i++) {
      if (this.entities[i].mouse_hover(V2(mpos.x - this.position.x, mpos.y - this.position.y))) {
        break;
      }
    }
  }
}

class Camera {
  constructor() {
    this.position = V2();
  }
}

class Sprite {
  constructor(paths, size) {
    this.index = -1;
    this.paths = paths;
    this.size = size;
    this.image = null;
    this.load_image = null;
    this.upgrading = false;
  }

  fix_size() {
    if (this.size == undefined) {
      this.size = V2(this.image.width, this.image.height);
    }
  }

  upgrade(callback = function() {}, level = this.index + 1) {
    if (level == "max") {
      level = this.paths.length - 1;
    }
    if (level + 1 > this.paths.length) {
      if (this.size == undefined) {
        this.size = V2(100);
      }
      if (this.image == null) {
        this.image = new Image();
      }
      callback();
      return;
    }
    if (level == this.index) {
      callback();
      return;
    }
    this.index = level;
    this.load_image = new Image();
    this.load_image.src = this.paths[this.index];
    this.upgrading = true;
    this.load_image.onload = () => {
      this.upgrading = false;
      this.image = this.load_image;
      this.fix_size();
      callback();
    }

    this.load_image.onerror = () => {
      this.upgrading = false;
      //console.log("sprite upgrade error");
      this.upgrade(callback);
    }
  }

  wait() {
    while(this.upgrading) {}
  }
}

class Loader {
  constructor() {
    this.sprite = sprites["gymvr_logo"];
    this.size = V2(200);
    this.size.y = (this.size.x / this.sprite.size.x) * this.sprite.size.y;
    this.finished = false;
    this.sizem = 1;
    this.opacity = 1;
  }
  tick() {
    if (env.loaded) {
      this.opacity = lerp(this.opacity, 0, 0.2, 0.001);
      if (this.opacity == 0) {
        env.onload();
        this.finished = true;
      }
    }

    this.sizem = 1 + Math.sin(new Date() / 500) * 0.05;

  }
  draw() {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.drawImage(this.sprite.image, (-this.size.x * this.sizem) / 2, (-this.size.y * this.sizem) / 2, this.size.x * this.sizem, this.size.y * this.sizem);
    ctx.restore();
  }
}

class Button extends Entity {
  constructor(sprite, config) {
    super();
    this.sprite = sprite;
    this.position = config.position && config.position.copy() || V2();
    this.size = config.size && config.size.copy() || V2();

    this.default_size = this.size.copy();
    this.default_position = this.position.copy();

    this.depth = config.depth || 100;
    this.mdepth = config.mdepth || this.depth;
    this.hover_animation = config.hoverAnimation;
    this.hover_animation && this.hover_animation.init(this);
    this.unhover_animation = config.unhoverAnimation;
    this.unhover_animation && this.unhover_animation.init(this);
    this.hovered_over = false;
    this.rotation = config.rotation || 0;

    this.on_press = config.onPress || function() {};
  }

  tick() {
    this.hover_animation && this.hover_animation.update();
    this.unhover_animation && this.unhover_animation.update();
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.rotation);
    ctx.drawImage(this.sprite.image, -this.size.x / 2, -this.size.y / 2, this.size.x, this.size.y);
    ctx.restore();
  }

  mouse_down(mpos) {
    if (this.check_mouse(mpos)) {
      this.on_press();
    }
  }

  mouse_hover(mpos) {
    if (this.check_mouse(mpos)) {
      if (!this.hovered_over) {
        this.hover_animation && this.hover_animation.start();
        this.unhover_animation && this.unhover_animation.stop();
      }
      this.hovered_over = true;
    } else {
      if (this.hovered_over) {
        this.hover_animation && this.hover_animation.stop();
        this.unhover_animation && this.unhover_animation.start();
      }
      this.hovered_over = false;
    }
    return this.hovered_over;
  }
  

}

class ToggleButton extends Button {
  constructor(sprite, config) {
    super(sprite, config);
    this.sprites = [this.sprite, ...config.sprites];
    this.state_count = config.stateCount || this.sprites.length;
    this.callbacks = [...config.callbacks];
    this.state = config.state || 0;
    this.sprite = this.sprites[this.state];
  }

  mouse_down(mpos) {
    if (this.check_mouse(mpos)) {
      this.callbacks[this.state]();
      this.state++;
      if (this.state >= this.state_count) {
        this.state = 0;
      }
      this.sprite = this.sprites[this.state];
    }
  }

  set_state(state) {
    if (state < 0 || state >= this.state_count) {
      return;
    }
    this.state = state;
    this.sprite = this.sprites[this.state];
  }
}

let slides = [];
let entities = [];
let activeslide = null;

const env = {
	camera: new Camera(),
	mouse: V2(),
	tps: 60,
	loader: null,
	slideidx: 0,
	playing: true,
	slide_duration: 300,
	play_timer: 300,
	masterSlide: {
		canvasSize: V2(800, 600)
	},
	dcs: V2(800, 650)
}

function nextslide() {
  activeslide.on_deactivate("next");
  env.slideidx += 1;
  if (env.slideidx == slides.length) {
    env.slideidx = 0;
  }
  activeslide = slides[env.slideidx];
  activeslide.on_activate("next");
}

function switchslide(idx, dir) {
  if (idx < 0 || idx >= slides.length) {
    return
  } else if (idx == env.slideidx) {
    return;
  }

  if (!dir) {
    dir = idx < env.slideidx && "prev" || "next";
  }

  activeslide.on_deactivate(dir);
  env.slideidx = idx;
  activeslide = slides[env.slideidx];
  activeslide.on_activate(dir);
}

function prevslide() {
  activeslide.on_deactivate("prev");
  env.slideidx -= 1;
  if (env.slideidx < 0) {
    env.slideidx = slides.length - 1;
  }
  activeslide = slides[env.slideidx];
  activeslide.on_activate("prev");
}

function tick() {

  if (!env.loader.finished) {
    env.loader.tick();
    return;
  }

  for (let i = 0; i < entities.length; i++) {
    entities[i].tick();
  }

  for (let i = 0; i < slides.length; i++) {
    slides[i].weak_tick();
  }

  activeslide && activeslide.tick();

  if (env.playing) {
    env.play_timer -= 1;
    if (env.play_timer <= 0) {
      nextslide();
      env.play_timer = env.slide_duration;
    }
  }
}

env.loaded = false;

const drawCallback = () => draw();
let cancelDraw = false;

function draw() {
  requestAnimationFrame(drawCallback);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0,0, canvas.width, canvas.height);


  ctx.save()
  ctx.translate(Math.round(-env.camera.position.x + env.dcs.x / 2), Math.round(-env.camera.position.y + env.dcs.y / 2));

  if (!env.loader.finished) {
    env.loader.draw();
    ctx.restore();
    return;
  }

  /*slides.sort(function(a, b) {
    if (a.depth < b.depth) {
      return -1;
    } else if (a.depth > b.depth) {
      return 1;
    }
  });*/

  for (let i = 0; i < slides.length; i++) {
	if (slides[i] == activeslide) {
		continue;
	}
	slides[i].weak_draw(ctx);
  }

  activeslide && activeslide.draw(ctx);

  entities.sort(function(a, b) {
    if (a.depth < b.depth) {
      return -1;
    } else if (a.depth > b.depth) {
      return 1;
    }
  });

  for (let i = 0; i < entities.length; i++) {
    entities[i].draw(ctx);
  }

  ctx.restore();

}

function proper_mouse_pos(event) {
	let rect = event.target.getBoundingClientRect();
	let mult = env.dcs.x / rect.width;
	let ret = V2((event.clientX - rect.x) * mult, (event.clientY - rect.y) * mult);
	return ret;
}

function mouse_down(event) {
  let mpos = proper_mouse_pos(event);
  env.mouse = V2((mpos.x) - env.dcs.x / 2 + env.camera.position.x, (mpos.y) + env.camera.position.y - env.dcs.y / 2);
  
  entities.sort(function(a, b) {
    if (a.mdepth > b.mdepth) {
      return -1;
    } else if (a.mdepth < b.mdepth) {
      return 1;
    }
  });

  for (let i = 0; i < entities.length; i++) {
    if (entities[i].mouse_down(env.mouse)) {
      return;
    }
  }

  if (activeslide) {
    activeslide.mouse_down(env.mouse);
  }
}

function mouse_up(event) {
  let mpos = proper_mouse_pos(event);
  env.mouse = V2((mpos.x) - env.dcs.x / 2 + env.camera.position.x, (mpos.y) + env.camera.position.y - env.dcs.y / 2);

  entities.sort(function(a, b) {
    if (a.mdepth > b.mdepth) {
      return -1;
    } else if (a.mdepth < b.mdepth) {
      return 1;
    }
  });

  for (let i = 0; i < entities.length; i++) {
    if (entities[i].mouse_up(env.mouse)) {
      return;
    }
  }

  if (activeslide) {
    activeslide.mouse_down(env.mouse);
  }
}

function mouse_hover(event) {
  let mpos = proper_mouse_pos(event);
  env.mouse = V2((mpos.x) - env.dcs.x / 2 + env.camera.position.x, (mpos.y) + env.camera.position.y - env.dcs.y / 2);

  entities.sort(function(a, b) {
    if (a.mdepth > b.mdepth) {
      return -1;
    } else if (a.mdepth < b.mdepth) {
      return 1;
    }
  });

  for (let i = 0; i < entities.length; i++) {
    if (entities[i].mouse_hover(env.mouse)) {
      return;
    }
  }

  if (activeslide) {
    activeslide.mouse_hover(env.mouse);
  }
}

function create_slides() {
  let csize = V2(1000, 750);
  // slide size multiplier
  let ssm = (600 / 750) * 0.9;
  // image hover size multiplier
  let ihsm = 1;
  // image slide lerp magnitude
  let islm = 1;
  // image enlarge lerp magnitude
  let ielm = 1;
  // slide slide lerp magnitude
  let sslm = 0.02;
  // slide englarge lerp magnitude
  let selm = 0.0;
  // slide enlarge from multiplier
  let sefm = 0.5;
  // text slide lerp magnitude
  let tslm = 1;
  // text enlarge lerp magnitude
  let telm = 1;
  // slide activate delay
  let sad = 0;
  // image activate delay step
  let iads = 0;


  let s = null;
  
  {
  for (let i = 1; i <= 2; i++) {
	  s = new Slide({
		  size: V2(csize.x * ssm, csize.y * ssm),
		  canvasSize: csize,
		  nextActivateAnimation: new SlideInLerpAnimation("right", sslm),
		  nextDeactivateAnimation: new SlideOutLerpAnimation("left", sslm),
		  prevActivateAnimation: new SlideInLerpAnimation("left", sslm),
		  prevDeactivateAnimation: new SlideOutLerpAnimation("right", sslm),
		  activateDelay: 0
	  });

	  slides.push(s);

	  s.add_background(new SolidBackground("#FFFFFF"));

	  s.add_entity(new ImageEnt(sprites["slides/" + i.toString()], s, {
		  lockImageRatio: true,
		  width: csize.x
	  }));
  }
  }

  // slide us1
  {
	  
  let scelm = 0.2
  let schsm = 1.2
  s = new Slide({
    size: V2(csize.x * ssm, csize.y * ssm),
    canvasSize: csize,
    nextActivateAnimation: new SlideInLerpAnimation("right", sslm),
    nextDeactivateAnimation: new SlideOutLerpAnimation("left", sslm),
    prevActivateAnimation: new SlideInLerpAnimation("left", sslm),
    prevDeactivateAnimation: new SlideOutLerpAnimation("right", sslm),
    activateDelay: sad
  });

  slides.push(s);
  
  s.add_background(new SolidBackground("#FFFFFF"));

  s.add_entity(new ImageEnt(sprites["us1/text1"], s, {
    lockImageRatio: true,
    activateAnimation: new EnlargeLerpAnimation(0, 1, telm),
    activateDelay: iads * 0,
    width: 222.961
  }));

  s.add_entity(new ImageEnt(sprites["us1/sc1"], s, {
    lockImageRatio: true,
    leftCornerPos: true,
    leftCanvasPos: true,
    activateAnimation: new EnlargeLerpAnimation(0, 1, ielm),
    hoverAnimation: new EnlargeLerpAnimation(undefined, schsm, scelm),
    unhoverAnimation: new EnlargeLerpAnimation(undefined, 1, scelm),
    shadowDraw: true,
    callback: () => switchslide(13 - 1),
    activateDelay: iads * 1,
    position: V2(379.022, 34.579),
    width: 241.957
  }));

  s.add_entity(new ImageEnt(sprites["us1/sc2"], s, {
    lockImageRatio: true,
    leftCornerPos: true,
    leftCanvasPos: true,
    activateAnimation: new EnlargeLerpAnimation(0, 1, ielm),
    hoverAnimation: new EnlargeLerpAnimation(undefined, schsm, scelm),
    unhoverAnimation: new EnlargeLerpAnimation(undefined, 1, scelm),
    shadowDraw: true,
    callback: () => switchslide(4 - 1),
    activateDelay: iads * 1.5,
    position: V2(560.792, 64.453),
    width: 249.754
  }));

  s.add_entity(new ImageEnt(sprites["us1/sc3"], s, {
    lockImageRatio: true,
    leftCornerPos: true,
    leftCanvasPos: true,
    activateAnimation: new EnlargeLerpAnimation(0, 1, ielm),
    hoverAnimation: new EnlargeLerpAnimation(undefined, schsm, scelm),
    unhoverAnimation: new EnlargeLerpAnimation(undefined, 1, scelm),
    shadowDraw: true,
    activateDelay: iads * 2,
    callback: () => switchslide(18 -1),
    position: V2(628.286, 254.022),
    width: 212.135
  }));

  s.add_entity(new ImageEnt(sprites["us1/sc4"], s, {
    lockImageRatio: true,
    leftCornerPos: true,
    leftCanvasPos: true,
    activateAnimation: new EnlargeLerpAnimation(0, 1, ielm),
    hoverAnimation: new EnlargeLerpAnimation(undefined, schsm, scelm),
    unhoverAnimation: new EnlargeLerpAnimation(undefined, 1, scelm),
    callback: () => switchslide(15 - 1),
    shadowDraw: true,
    activateDelay: iads * 2.5,
    position: V2(560.792, 435.792),
    width: 249.753
  }));

  s.add_entity(new ImageEnt(sprites["us1/sc5"], s, {
    lockImageRatio: true,
    leftCornerPos: true,
    leftCanvasPos: true,
    activateAnimation: new EnlargeLerpAnimation(0, 1, ielm),
    hoverAnimation: new EnlargeLerpAnimation(undefined, schsm, scelm),
    unhoverAnimation: new EnlargeLerpAnimation(undefined, 1, scelm),
    shadowDraw: true,
    callback: () => switchslide(20 -1),
    activateDelay: iads * 3,
    position: V2(379.022, 503.289),
    width: 241.957
  }));

  s.add_entity(new ImageEnt(sprites["us1/sc6"], s, {
    lockImageRatio: true,
    leftCornerPos: true,
    leftCanvasPos: true,
    activateAnimation: new EnlargeLerpAnimation(0, 1, ielm),
    hoverAnimation: new EnlargeLerpAnimation(undefined, schsm, scelm),
    unhoverAnimation: new EnlargeLerpAnimation(undefined, 1, scelm),
    callback: () => switchslide(17 -1),
    shadowDraw: true,
    activateDelay: iads * 2.5,
    position: V2(189.454, 435.793),
    width: 249.754
  }));

  s.add_entity(new ImageEnt(sprites["us1/sc7"], s, {
    lockImageRatio: true,
    leftCornerPos: true,
    leftCanvasPos: true,
    activateAnimation: new EnlargeLerpAnimation(0, 1, ielm),
    hoverAnimation: new EnlargeLerpAnimation(undefined, schsm, scelm),
    unhoverAnimation: new EnlargeLerpAnimation(undefined, 1, scelm),
    shadowDraw: true,
    activateDelay: iads * 2,
    callback: () => switchslide(16 - 1),
    position: V2(159.579, 254.022),
    width: 212.135
  }));

  s.add_entity(new ImageEnt(sprites["us1/sc8"], s, {
    lockImageRatio: true,
    leftCornerPos: true,
    leftCanvasPos: true,
    activateAnimation: new EnlargeLerpAnimation(0, 1, ielm),
    hoverAnimation: new EnlargeLerpAnimation(undefined, schsm, scelm),
    unhoverAnimation: new EnlargeLerpAnimation(undefined, 1, scelm),
    shadowDraw: true,
    callback: () => switchslide(9 - 1),
    activateDelay: iads * 1.5,
    position: V2(189.455, 64.454),
    width: 249.753
  }));
  }


  for (let i = 4; i <= 21; i++) {
	  s = new Slide({
		  size: V2(csize.x * ssm, csize.y * ssm),
		  canvasSize: csize,
		  nextActivateAnimation: new SlideInLerpAnimation("right", sslm),
		  nextDeactivateAnimation: new SlideOutLerpAnimation("left", sslm),
		  prevActivateAnimation: new SlideInLerpAnimation("left", sslm),
		  prevDeactivateAnimation: new SlideOutLerpAnimation("right", sslm),
		  activateDelay: 0
	  });

	  slides.push(s);

	  s.add_background(new SolidBackground("#FFFFFF"));

	  s.add_entity(new ImageEnt(sprites["slides/" + i.toString()], s, {
		  lockImageRatio: true,
		  width: csize.x
	  }));
  }

  // slide us21
  {
  let ltslm = 0.2
  let ltelm = 0.2
  let lislm = 0.2
  let lielm = 0.2
  let liads = 20
  
  s = new Slide({
    size: V2(csize.x * ssm, csize.y * ssm),
    canvasSize: csize,
    nextActivateAnimation: new SlideInLerpAnimation("right", sslm),
    nextDeactivateAnimation: new SlideOutLerpAnimation("left", sslm),
    prevActivateAnimation: new SlideInLerpAnimation("left", sslm),
    prevDeactivateAnimation: new SlideOutLerpAnimation("right", sslm),
    activateDelay: sad
  });

  slides.push(s);

  s.add_background(new SolidBackground("#ffffff"));
  

  s.add_entity(new ImageEnt(sprites["us21/title"], s, {
    lockImageRatio: true,
    leftCornerPos: true,
    leftCanvasPos: true,
    activateAnimation: new CompoundAnimation([new SlideInLerpAnimation("up", ltslm), new EnlargeLerpAnimation(0, 1, ltelm)]),
    activateDelay: liads * 0,
    position: V2(457.172, 119.365),
    width: 105.579
  }));

  let textPopOffset = liads * 1;
  let textPopWindow = 240;

  let texts = [
    [135.743, 191.339, 119.522],
    [294.525, 191.350, 121.357],
    [453.811, 191.350, 114.795],
    [604.516, 187.393, 167.543],
    [807.293, 190.690, 53.662],
    [135.669, 225.636, 127.529],
    [300.963, 225.792, 83.037],
    [414.606, 226.088, 68.389],
    [517.389, 224.782, 82.998],
    [632.778, 225.540, 90.928],
    [756.774, 226.045, 122.568],
    [157.459, 258.622, 108.311],
    [303.944, 258.370, 131.787],
    [472.639, 257.865, 88.467],
    [598.656, 257.612, 128.779],
    [763.816, 257.612, 93.350],
    [135.753, 299.324, 30.566],
    [196.254, 294.578, 128.965],
    [359.821, 298.493, 126.982],
    [521.509, 298.493, 107.217],
    [661.152, 298.493, 60.068],
    [754.480, 298.271, 125.225],
    [155.459, 340.687, 93.662],
    [286.022, 340.445, 110.967],
    [431.755, 336.409, 78.855],
    [545.917, 339.940, 142.881],
    [726.229, 340.445, 132.959],
    [136.300, 382.871, 86.904],
    [274.691, 383.881, 95.381],
    [420.658, 382.366, 85.420],
    [557.029, 382.871, 88.662],
    [694.448, 379.340, 158.496],
    [135.119, 417.065, 132.803],
    [331.099, 417.422, 115.772],
    [510.741, 418.136, 146.436],
    [721.099, 417.422, 125.225],
    [133.956, 457.065, 146.787],
    [318.599, 457.065, 87.295],
    [438.429, 453.621, 135.387],
    [605.669, 457.065, 90.576],
    [734.393, 457.524, 125.381],
    [136.893, 491.810, 85.147],
    [274.393, 492.167, 122.100],
    [448.950, 492.065, 88.662],
    [587.965, 492.167, 111.162],
    [749.750, 492.167, 100.107],
    [134.750, 524.394, 88.662],
    [271.536, 524.310, 91.475],
    [410.822, 524.310, 132.061],
    [591.179, 524.310, 112.256],
    [752.250, 524.667, 100.147],
    [134.393, 556.096, 96.123],
    [263.322, 556.453, 86.279],
    [383.322, 556.453, 74.912],
    [489.393, 556.810, 84.482],
  ]

  let bullets = [
    [269.375, 194.822], [430.089, 194.554], [579.197, 195.089], [784.911, 195.268], [871.875, 194.911],
    [277.723, 228.731], [394.038, 228.940], [494.375, 228.839], [610.982, 229.018], [734.732, 229.018],
    [134.281, 263.318], [278.661, 261.875], [449.018, 261.518], [573.304, 261.875], [740.089, 261.875], [871.875, 261.875],
    [173.661, 301.875], [337.947, 301.518], [499.732, 301.875], [641.875, 301.161], [732.589, 301.875],
    [133.661, 344.018], [264.018, 344.018], [409.732, 344.732], [522.589, 344.018], [700.089, 344.732], [870.804, 345.089],
    [244.375, 387.232], [390.089, 386.518], [527.589, 386.875], [664.732, 386.518], [871.161, 387.232],
    [294.018, 421.161], [472.232, 421.518], [682.589, 420.804], [871.518, 421.161],
    [294.018, 461.161], [416.161, 460.804], [581.518, 460.804], [709.375, 461.518], [871.875, 460.804],
    [242.947, 495.089], [417.232, 495.089], [557.232, 494.732], [719.732, 495.089], [871.518, 495.447],
    [243.304, 528.304], [382.589, 528.304], [562.232, 528.661], [722.232, 527.947], [871.518, 527.947],
    [242.232, 560.447], [360.089, 560.089], [469.375, 560.089],

  ]

  for (let i = 0; i < texts.length; i++) {
    s.add_entity(new ImageEnt(sprites["us21/text" + (i + 1).toString()], s, {
      lockImageRatio: true,
      leftCornerPos: true,
      leftCanvasPos: true,
      activateAnimation: new EnlargeLerpAnimation(0, 1, lielm),
      activateDelay: textPopOffset + textPopWindow * Math.random(),
      position: V2(texts[i][0], texts[i][1]),
      width: texts[i][2]
    }));
  }

  for (let i = 0; i < bullets.length; i++) {
    s.add_entity(new ImageEnt(sprites["us21/circle"], s, {
      lockImageRatio: true,
      leftCornerPos: true,
      leftCanvasPos: true,
      activateAnimation: new EnlargeLerpAnimation(0, 1, lielm),
      activateDelay: textPopOffset + textPopWindow * Math.random(),
      position: V2(bullets[i][0], bullets[i][1]),
      width: 11.250
    }));
  }

  s.add_entity(new ImageEnt(sprites["us21/endtitle"], s, {
    lockImageRatio: true,
    leftCornerPos: true,
    leftCanvasPos: true,
    activateAnimation: new CompoundAnimation([new SlideInLerpAnimation("down", ltslm), new EnlargeLerpAnimation(0, 1, ltelm)]),
    activateDelay: textPopOffset + textPopWindow + liads * 1,
    position: V2(391.479, 596.371),
    width: 233.784
  }));

  s.add_entity(new ImageEnt(sprites["us21/endtext"], s, {
    lockImageRatio: true,
    leftCornerPos: true,
    leftCanvasPos: true,
    activateAnimation: new CompoundAnimation([new SlideInLerpAnimation("down", ltslm), new EnlargeLerpAnimation(0, 1, ltelm)]),
    activateDelay: textPopOffset + textPopWindow + liads * 2,
    position: V2(391.482, 642.964),
    width: 227.180
  }));

  s.add_entity(new ImageEnt(sprites["us21/heart1"], s, {
    lockImageRatio: true,
    leftCornerPos: true,
    leftCanvasPos: true,
    activateAnimation: new EnlargeLerpAnimation(0, 1, lielm),
    activateDelay: textPopOffset + textPopWindow + liads * 3,
    position: V2(285.712, 602.841),
    width: 45.526
  }));

  s.add_entity(new ImageEnt(sprites["us21/heart2"], s, {
    lockImageRatio: true,
    leftCornerPos: true,
    leftCanvasPos: true,
    activateAnimation: new EnlargeLerpAnimation(0, 1, lielm),
    activateDelay: textPopOffset + textPopWindow + liads * 3.5,
    position: V2(649.962, 577.113),
    width: 53.886
  }));


  }
  
  for (let i = 23; i <= 23; i++) {
	  s = new Slide({
		  size: V2(csize.x * ssm, csize.y * ssm),
		  canvasSize: csize,
		  nextActivateAnimation: new SlideInLerpAnimation("right", sslm),
		  nextDeactivateAnimation: new SlideOutLerpAnimation("left", sslm),
		  prevActivateAnimation: new SlideInLerpAnimation("left", sslm),
		  prevDeactivateAnimation: new SlideOutLerpAnimation("right", sslm),
		  activateDelay: 0
	  });

	  slides.push(s);

	  s.add_background(new SolidBackground("#FFFFFF"));

	  s.add_entity(new ImageEnt(sprites["slides/" + i.toString()], s, {
		  lockImageRatio: true,
		  width: csize.x
	  }));
  }


}

let sprites = {};

let toLoad = 0;

const assetPath = "/img/prezentacia/";

function preload_sprites(callback) {


  let S = {
	"us1": ["text1.png", "sc1.png", "sc2.png", "sc3.png", "sc4.png", "sc5.png", "sc6.png", "sc7.png", "sc8.png"],
    "us21": ["title.png", "endtitle.png", "endtext.png", "circle.png", "heart1.png", "heart2.png"],
	  "slides": [],
	
  }

  for (let i = 1; i <= 55; i++) {
    S["us21"].push("text" + i.toString() + ".png");
  }
 
	for (let i = 1; i <= 23; i++) {
		S["slides"].push(i.toString() + ".jpg");
	}

  for (slide of Object.keys(S)) {
    for (image of S[slide]) {
      toLoad++;
      //console.log(slide + "/" + image);
      let s = new Sprite([assetPath + slide + "/min/" + image, assetPath + slide + "/max/" + image]);
      s.upgrade(callback);
      sprites[slide + "/" + image.split(".")[0]] = s;
    }
  }

  toLoad++;
  sprites["arrow_icon"] = new Sprite([assetPath + "arrow_icon.png"]);
  sprites["arrow_icon"].upgrade(callback, "max");

  toLoad++;
  sprites["menu_icon"] = new Sprite([assetPath + "menu_icon.png"]);
  sprites["menu_icon"].upgrade(callback, "max");

  toLoad++;
  sprites["play_icon"] = new Sprite([assetPath + "play_icon.png"]);
  sprites["play_icon"].upgrade(callback, "max");

  toLoad++;
  sprites["pause_icon"] = new Sprite([assetPath + "pause_icon.png"]);
  sprites["pause_icon"].upgrade(callback, "max");


}

env.onload = () => {
  env.camera.position.y = 25;
  create_slides();
  activeslide = slides[0];
  activeslide.on_activate();

  let pause = () => {
    env.playing = false;
  }

  let play = () => {
    env.playing = true;
    env.play_timer = env.slide_duration;
  }

  let play_button = null;

  let barypos = canvas.height / 2 - 10;

  entities.push(
    new Button(sprites["arrow_icon"], {
      position: V2(-35 * 1.5, barypos),
      size: V2(30, 30),
      depth: 100,
      onPress: () => {
        prevslide();
        pause();
        play_button.set_state(0);
      },
      rotation: Math.PI * (1/2),
      hoverAnimation: new EnlargeLerpAnimation(undefined, 1.2, 0.3),
      unhoverAnimation: new EnlargeLerpAnimation(undefined, 1, 0.3)
    })
  );

  entities.push(
    new Button(sprites["arrow_icon"], {
      position: V2(35 * 1.5, barypos),
      size: V2(30, 30),
      depth: 100,
      rotation: Math.PI * (3/2),
      onPress: () => {
        nextslide();
        pause();
        play_button.set_state(0);
      },
      hoverAnimation: new EnlargeLerpAnimation(undefined, 1.2, 0.3),
      unhoverAnimation: new EnlargeLerpAnimation(undefined, 1, 0.3)
    })
  );

  entities.push(
    new Button(sprites["menu_icon"], {
      position: V2(-35/2, barypos),
      size: V2(30, 30),
      depth: 100,
      onPress: () => {
        switchslide(3 - 1);
        pause();
        play_button.set_state(0);
      },
      hoverAnimation: new EnlargeLerpAnimation(undefined, 1.2, 0.3),
      unhoverAnimation: new EnlargeLerpAnimation(undefined, 1, 0.3)
    })
  );

  play_button = new ToggleButton(sprites["play_icon"], {
    position: V2(35/2, barypos),
    size: V2(30, 30),
    depth: 100,
    state: 1,
    sprites: [sprites["pause_icon"]],
    callbacks: [() => play(), () => pause()],
    hoverAnimation: new EnlargeLerpAnimation(undefined, 1.2, 0.3),
    unhoverAnimation: new EnlargeLerpAnimation(undefined, 1, 0.3)
  });
    
  entities.push(play_button);

};

function main() {
  canvas.addEventListener("mousedown", (event) => mouse_down(event));
  canvas.addEventListener("mouseup", (event) => mouse_up(event));
  canvas.addEventListener("mousemove", (event) => mouse_hover(event));

  sprites["gymvr_logo"].wait();
  
  preload_sprites(() => {
    toLoad--;
    if (toLoad <= 0) {
      env.loaded = true;
    }
  });

  env.loader = new Loader();


  env.tickInterval = setInterval(() => tick(), 1000 / env.tps);
  requestAnimationFrame(drawCallback);
}

sprites["gymvr_logo"] = new Sprite([assetPath + "logo.png"]);
sprites["gymvr_logo"].upgrade();

window.onload = main;

}
