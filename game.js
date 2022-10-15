const PX_PER_CREDIT = 22
const SEMESTER_HEIGHT = 50
const CREDITS_PER_SEMESTER = 30
const SEMESTER_SPACING = 10
const NUM_SEMESTERS = 6
const MODUL_BORDER =

placed_objects = []

function create_semester_grid() {
    const semester_group = new PIXI.Container();

    for (let semester_index = 0; semester_index < NUM_SEMESTERS; semester_index++) {

        const semester_container = new PIXI.Container();

        const semester_block = new PIXI.Graphics();

        semester_block.lineStyle(2, 0xcccccc, 1);
        semester_block.beginFill(0xFFFFFF);
        semester_block.drawRect(0, 0, 30 * PX_PER_CREDIT, SEMESTER_HEIGHT);
        semester_block.endFill();

        semester_container.addChild(semester_block);

        for (let index = 0; index < CREDITS_PER_SEMESTER * PX_PER_CREDIT; index += 3 * PX_PER_CREDIT) {
            const credit_line = new PIXI.Graphics();

            credit_line.lineStyle(1, 0xcccccc, 1);
            credit_line.moveTo(0, 0);
            credit_line.lineTo(0, SEMESTER_HEIGHT);

            credit_line.position.x = index;
            credit_line.position.y = 0;
            semester_container.addChild(credit_line);
        }

        semester_container.y = (SEMESTER_HEIGHT + SEMESTER_SPACING) * semester_index

        semester_group.addChild(semester_container)
    }


    return semester_group
}

function create_modul(modul_name) {
    const modul = MODULE_DEFINITIONS[modul_name]

    const modul_container = new PIXI.Container();

    const modul_block = new PIXI.Graphics();

    modul_block.lineStyle(2, 0xcccccc, 1);
    modul_block.beginFill(parse_color(modul['color']));
    modul_block.drawRect(
        MODUL_BORDER,
        MODUL_BORDER,
        modul['credits'] * PX_PER_CREDIT - 2 * MODUL_BORDER,
        SEMESTER_HEIGHT - 2 * MODUL_BORDER);
    modul_block.endFill();

    modul_container.addChild(modul_block)


    const textStyle = new PIXI.TextStyle({
        fontFamily: 'Arial',
        fill: ['#000000'],
        fontSize: 10,
        fontWeight: 'lighter',
    });
    const basicText = new PIXI.Text(modul_name, textStyle);
    basicText.x = modul['credits'] * PX_PER_CREDIT / 2;
    basicText.y = SEMESTER_HEIGHT / 2;
    basicText.anchor.set(0.5, 0.5);

    modul_container.addChild(basicText)

    return modul_container
}

function testForAABB(object1, object2, depth_offset = 0, side_offset = 0) {
    const bounds1 = object1.getBounds();
    const bounds2 = object2.getBounds();

    return bounds1.x < bounds2.x + bounds2.width + side_offset
        && bounds1.x + bounds1.width > bounds2.x + side_offset
        && bounds1.y < bounds2.y + depth_offset + bounds2.height
        && bounds1.y + bounds1.height > bounds2.y + depth_offset;
}

function move_module_side(modul, cp) {
    const new_x = modul.x + cp * PX_PER_CREDIT
    const right_boundary = CREDITS_PER_SEMESTER * PX_PER_CREDIT - modul.width
    const module_left_border = new_x >= 0
    const module_right_border = new_x < right_boundary
    if (module_left_border && module_right_border && !module_colliding_side(modul, cp)) {
        modul.x = new_x
    }
}

function module_colliding_side(modul, cp) {
    return false
    const collides_with_other_object = placed_objects.some(
        (obj) => testForAABB(
            obj, modul, side_offset=PX_PER_CREDIT * cp))

    return collides_with_other_object;
}

function module_blocked_at_bottom(modul) {
    const collides_with_other_object = placed_objects.some((obj) => testForAABB(
        obj,
        modul,
        depth_offset = 1 * (SEMESTER_HEIGHT + SEMESTER_SPACING)))
    const last_semester = modul.y >= (NUM_SEMESTERS - 1) * (SEMESTER_HEIGHT + SEMESTER_SPACING)
    return collides_with_other_object || last_semester;
}

function move_module_down(modul) {
    const new_y = modul.y + SEMESTER_HEIGHT + SEMESTER_SPACING
    if (!module_blocked_at_bottom(modul)) {
        modul.y = new_y
    }
}

function parse_color(color_string) {
    return parseInt(color_string, 16)
}

function onKeyDown(key) {
    if (key.keyCode === 65) {
        move_module_side(current_module, -1)
    }
    if (key.keyCode === 68) {
        move_module_side(current_module, 1)
    }
    if (key.keyCode === 83) {
        move_module_down(current_module)
    }
}

document.addEventListener('keydown', onKeyDown);

let type = "WebGL";
if (!PIXI.utils.isWebGLSupported()) {
    type = "canvas";
}


const request = new XMLHttpRequest();
request.open("GET", "config/module.json", false);
request.send(null);
const MODULE_DEFINITIONS = JSON.parse(request.responseText);

module_names = Object.keys(MODULE_DEFINITIONS)

module_sequence = module_names.sort((a, b) => 0.5 - Math.random())

const app = new PIXI.Application({
    width: 800,         // default: 800
    height: 600,        // default: 600
    antialias: true,    // default: false
    resolution: 1       // default: 1
});

app.renderer.backgroundColor = 0xFFFFFF;

semester_grid = create_semester_grid()
semester_grid.x = 50
semester_grid.y = 50

app.stage.addChild(semester_grid)

current_module = create_modul(module_sequence.pop())

semester_grid.addChild(current_module)

game_counter = 1
app.ticker.add(() => {
    if (game_counter % 200 === 0) {
        move_module_down(current_module)
    }
    if (module_blocked_at_bottom(current_module) && module_sequence.length != 0) {
        placed_objects.push(current_module)
        current_module = create_modul(module_sequence.pop())
        current_module.y = 0
        semester_grid.addChild(current_module)
    }
    game_counter++
});

document.body.appendChild(app.view);
