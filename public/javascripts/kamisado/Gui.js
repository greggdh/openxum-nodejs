"use strict";

Kamisado.Gui = function (c, e, l, g) {

// private attributes
    var _engine = e;
    var _color = c;
    var _gui = g;

    var canvas;
    var context;
    var manager;
    var height;
    var width;

    var deltaX;
    var deltaY;
    var offsetX;
    var offsetY;

    var scaleX;
    var scaleY;

    var opponentPresent = l;

    var selected_cell;
    var selected_tower;
    var possible_move_list;

    var moving_tower;
    var target;
    var delta;
    var id;

// private methods
    var compute_coordinates = function (x, y) {
        return { x: Math.floor((x - offsetX) / (deltaX + 4)), y: Math.floor((y - offsetY) / (deltaY + 4)) };
    };

    var draw_grid = function () {
        context.lineWidth = 1;
        context.strokeStyle = "#000000";
        for (var i = 0; i < 8; ++i) {
            for (var j = 0; j < 8; ++j) {
                context.fillStyle = Kamisado.colors[i][j];
                context.beginPath();
                context.moveTo(offsetX + i * deltaX, offsetY + j * deltaY);
                context.lineTo(offsetX + (i + 1) * deltaX - 2, offsetY + j * deltaY);
                context.lineTo(offsetX + (i + 1) * deltaX - 2, offsetY + (j + 1) * deltaY - 2);
                context.lineTo(offsetX + i * deltaX, offsetY + (j + 1) * deltaY - 2);
                context.moveTo(offsetX + i * deltaX, offsetY + j * deltaY);
                context.closePath();
                context.fill();
            }
        }
    };

    var draw_possible_move = function () {
        for (var i = 0; i < possible_move_list.length; ++i) {
            var x = offsetX + deltaX / 2 + possible_move_list[i].x * deltaX;
            var y = offsetY + deltaY / 2 + possible_move_list[i].y * deltaY;

            context.beginPath();
            context.lineWidth = 2;
            context.strokeStyle = _engine.current_color === Kamisado.Color.BLACK ? "#ffffff" : "#000000";
            context.fillStyle = _engine.current_color === Kamisado.Color.BLACK ? "#000000" : "#ffffff";
            context.arc(x, y, deltaX / 3, 0.0, 2 * Math.PI, false);
            context.stroke();
            context.fill();
            context.closePath();
        }
    };

    var draw_tower = function (x, y, width, height, color, tower_color) {
        context.lineWidth = 4;
        context.strokeStyle = color;
        context.fillStyle = tower_color;

        context.beginPath();
        context.moveTo(x + width / 3, y);
        context.lineTo(x + 2 * width / 3, y);
        context.lineTo(x + width, y + height / 3);
        context.lineTo(x + width, y + 2 * height / 3);
        context.lineTo(x + 2 * width / 3, y + height);
        context.lineTo(x + width / 3, y + height);
        context.lineTo(x, y + 2 * height / 3);
        context.lineTo(x, y + height / 3);
        context.lineTo(x + width / 3, y);
        context.closePath();
        context.fill();
        context.stroke();
    };

    var draw_towers = function () {
        var hidden = selected_tower && selected_cell;
        var i;
        var tower;

        for (i = 0; i < 8; ++i) {
            tower = _engine.get_white_towers()[i];
            if (!hidden || (hidden && (selected_tower.x !== tower.x || selected_tower.y !== tower.y))) {
                draw_tower(offsetX + tower.x * deltaX + 4, offsetY + tower.y * deltaY + 4,
                        deltaX - 10, deltaY - 10, "#ffffff", tower.color);
            }
        }
        for (i = 0; i < 8; ++i) {
            tower = _engine.get_black_towers()[i];
            if (!hidden || (hidden && (selected_tower.x !== tower.x || selected_tower.y !== tower.y))) {
                draw_tower(offsetX + tower.x * deltaX + 4, offsetY + tower.y * deltaY + 4,
                        deltaX - 10, deltaY - 10, "#000000", tower.color);
            }
        }
    };

    var draw_state = function () {
        draw_towers();
    };

    var roundRect = function (x, y, width, height, radius, fill, stroke) {
        if (typeof stroke === "undefined") {
            stroke = true;
        }
        if (typeof radius === "undefined") {
            radius = 5;
        }
        context.beginPath();
        context.moveTo(x + radius, y);
        context.lineTo(x + width - radius, y);
        context.quadraticCurveTo(x + width, y, x + width, y + radius);
        context.lineTo(x + width, y + height - radius);
        context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        context.lineTo(x + radius, y + height);
        context.quadraticCurveTo(x, y + height, x, y + height - radius);
        context.lineTo(x, y + radius);
        context.quadraticCurveTo(x, y, x + radius, y);
        context.closePath();
        if (stroke) {
            context.stroke();
        }
        if (fill) {
            context.fill();
        }
    };

    var show_selectable_tower = function () {
        if (_engine.get_play_color()) {
            var selectable_tower = _engine.find_playable_tower(_engine.current_color());
            var x = offsetX + deltaX / 2 + selectable_tower.x * deltaX;
            var y = offsetY + deltaY / 2 + selectable_tower.y * deltaY;

            context.beginPath();
            context.lineWidth = 2;
            context.strokeStyle = _engine.current_color !== Kamisado.Color.BLACK ? "#ffffff" : "#000000";
            context.fillStyle = _engine.current_color !== Kamisado.Color.BLACK ? "#000000" : "#ffffff";
            context.arc(x, y, deltaX / 4, 0.0, 2 * Math.PI, false);
            context.stroke();
            context.fill();
            context.closePath();
        }
    };

    var draw = function () {
        context.lineWidth = 1;

        // background
        context.fillStyle = "#000000";
        roundRect(0, 0, canvas.width, canvas.height, 17, true, false);

        draw_grid();
        draw_state();
        if (!(selected_tower && selected_cell)) {
            show_selectable_tower();
        }
        if (possible_move_list) {
            draw_possible_move();
        }
    };

    var getClickPosition = function (e) {
        var rect = canvas.getBoundingClientRect();

        return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
    };

    var find_tower = function (x, y) {
        var coordinates = compute_coordinates(x, y);
        var k = 0;
        var found = false;
        var towers;

        if (_engine.current_color() === Kamisado.Color.BLACK) {
            towers = _engine.get_black_towers();
        } else {
            towers = _engine.get_white_towers();
        }
        while (!found && k < 8) {
            if (towers[k].x === coordinates.x && towers[k].y === coordinates.y) {
                found = true;
            } else {
                ++k;
            }
        }
        if (found) {
            return { x: towers[k].x, y: towers[k].y, color: _engine.current_color(), tower_color: towers[k].color };
        } else {
            return null;
        }
    };

    var init = function () {
        selected_cell = null;
        selected_tower = null;
        possible_move_list = null;
    };

    var move_tower = function () {
        draw();
        draw_tower(moving_tower.x, moving_tower.y, moving_tower.w, moving_tower.h,
            moving_tower.color, moving_tower.selected_color);
        moving_tower.x += delta.x;
        moving_tower.y += delta.y;
        if (((delta.x >= 0 && moving_tower.x >= target.x) ||
            (delta.x < 0 && moving_tower.x <= target.x)) &&
            ((delta.y >= 0 && moving_tower.y >= target.y) ||
                (delta.y < 0 && moving_tower.y <= target.y))) {
            clearInterval(id);
            manager.play();
        }
    };

    var animate = function (color) {
        var dx = selected_cell.x - selected_tower.x;
        var dy = selected_cell.y - selected_tower.y;

        moving_tower = {
            x: offsetX + selected_tower.x * deltaX + 4,
            y: offsetY + selected_tower.y * deltaY + 4,
            w: deltaX - 10,
            h: deltaY - 10,
            color: color === Kamisado.Color.BLACK ? '#000000' : '#ffffff',
            selected_color: selected_tower.tower_color
        };
        target = {
            x: offsetX + selected_cell.x * deltaX + 4,
            y: offsetY + selected_cell.y * deltaY + 4
        };
        delta = {
            x: (dx === 0 ? 0 : dx > 0 ? 1 : -1) * deltaX / 20,
            y: (dy === 0 ? 0 : dy > 0 ? 1 : -1) * deltaY / 20
        };
        id = setInterval(move_tower, 10);
    };

    var onClick = function (event) {
        if (_engine.current_color() === _color || _gui) {
            var pos = getClickPosition(event);
            var select = find_tower(pos.x, pos.y);

            if (select) {
                if (select.color === _engine.current_color()) {
                    if (_engine.phase() === Kamisado.Phase.MOVE_TOWER &&
                        (!_engine.get_play_color() || select.tower_color === _engine.get_play_color())) {
                        selected_tower = select;
                        possible_move_list = _engine.get_possible_moving_list(selected_tower);
                        manager.play();
                    }
                }
            } else {
                var coordinates = compute_coordinates(pos.x, pos.y);

                if (_engine.phase() === Kamisado.Phase.MOVE_TOWER && possible_move_list && _engine.is_possible_move(coordinates, possible_move_list)) {
                    selected_cell = coordinates;
                    possible_move_list = null;
                    animate(_engine.current_color());
                }
            }
        }
    };

// public methods
    this.color = function () {
        return _color;
    };

    this.draw = function () {
        draw();
    };

    this.engine = function () {
        return _engine;
    };

    this.get_move = function () {
        if (_engine.phase() === Kamisado.Phase.MOVE_TOWER && selected_tower && selected_cell) {
            return new Kamisado.Move(selected_tower, selected_cell);
        }
        return null;
    };

    this.get_selected_cell = function () {
        return selected_cell;
    };

    this.get_selected_tower = function () {
        return selected_tower;
    };

    this.is_animate = function () {
        return true;
    };

    this.is_remote = function () {
        return false;
    };

    this.move = function (move, color) {
        selected_tower = move.from();
        selected_tower = _engine.find_tower(move.from(), color);
        selected_cell = move.to();
        animate(color);
    };

    this.ready = function (r) {
        opponentPresent = r;
        if (manager) {
            manager.redraw();
        }
    };

    this.set_canvas = function (c) {
        canvas = c;
        context = c.getContext("2d");
        height = canvas.height;
        width = canvas.width;
        canvas.addEventListener("click", onClick, true);
        deltaX = (width * 0.95 - 10) / 8;
        deltaY = (height * 0.95 - 10) / 8;
        offsetX = width / 2 - deltaX * 4;
        offsetY = height / 2 - deltaY * 4;

        scaleX = height / canvas.offsetHeight;
        scaleY = width / canvas.offsetWidth;

        this.draw();
    };

    this.set_manager = function (m) {
        manager = m;
    };

    this.unselect = function () {
        selected_cell = null;
        selected_tower = null;
    };

    init();
};
