"use strict";

Kamisado.Manager = function (e, g, o, s) {
// private attributes
    var _super = new OpenXum.Manager(e, g, o, s);

// public methods
    this.engine = _super.engine;
    this.get_moves = _super.get_moves;
    this.load_elo = _super.load_elo;
    this.load_level = _super.load_level;
    this.next = _super.next;
    this.play = _super.play;
    this.play_other = _super.play_other;
    this.play_remote = _super.play_remote;
    this.ready = _super.ready;
    this.redraw = _super.redraw;
    this.replay = _super.replay;

    this.build_move = function () {
        return new Kamisado.Move();
    };

    this.get_current_color = function () {
        return _super.engine().current_color() === Kamisado.Color.BLACK ? 'Black' : 'White';
    };

    this.get_name = function () {
        return 'kamisado';
    };

    this.get_winner_color = function () {
        return _super.engine().winner_is() === Kamisado.Color.BLACK ? 'black' : 'white';
    };

    this.process_move = function () {
        _super.gui().draw();
    };

    _super.that(this);
};