const PX_PER_CREDIT = 34
const SEMESTER_HEIGHT = 70
const CREDITS_PER_SEMESTER = 30
const SEMESTER_SPACING = 18
const NUM_SEMESTERS = 8
const MODUL_BORDER = 6
const STEP_SIZE = 3

let finished = false

placed_objects = []

function create_semester_grid() {
    const semester_group = new PIXI.Container();

    for (let semester_index = 0; semester_index < NUM_SEMESTERS; semester_index++) {

        const semester_container = new PIXI.Container();

        const semester_block = new PIXI.Graphics();

        semester_block.lineStyle(3, 0xcccccc, 1);
        semester_block.beginFill(0xFFFFFF);
        semester_block.drawRect(0, 0, 30 * PX_PER_CREDIT, SEMESTER_HEIGHT);
        semester_block.endFill();

        semester_container.addChild(semester_block);

        for (let index = 0; index < CREDITS_PER_SEMESTER * PX_PER_CREDIT; index += 3 * PX_PER_CREDIT) {
            const credit_line = new PIXI.Graphics();

            credit_line.lineStyle(3, 0xcccccc, 1);
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
    const modul = module_definitions[modul_name]

    const modul_container = new PIXI.Container();

    const modul_block = new PIXI.Graphics();

    modul_block.lineStyle(3, 0xcccccc, 1);
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
        fontSize: 14,
        fontWeight: 'lighter',
        align: "center"
    });
    const basicText = new PIXI.Text(modul_name, textStyle);
    basicText.x = modul['credits'] * PX_PER_CREDIT / 2;
    basicText.y = SEMESTER_HEIGHT / 2;
    basicText.anchor.set(0.5, 0.5);

    modul_container.addChild(basicText)

    return modul_container
}

function testForAABB(object1, object2, depth_offset, side_offset) {
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
    const module_sides_free = !module_colliding_side(modul, cp * PX_PER_CREDIT)
    if (module_left_border && module_right_border && module_sides_free) {
        modul.x = new_x
    }
}

function module_colliding_side(modul, side_offset) {
    return placed_objects.some(
        (obj) => testForAABB(
            obj, modul, 0, side_offset))
}

function module_blocked_at_bottom(modul) {
    const collides_with_other_object = placed_objects.some((obj) => testForAABB(
        obj,
        modul,
        SEMESTER_HEIGHT + SEMESTER_SPACING,
        0))
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
        move_module_side(current_module, -STEP_SIZE)
    }
    if (key.keyCode === 68) {
        move_module_side(current_module, STEP_SIZE)
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

const module_config = JSON.parse(request.responseText)
const module_definitions = module_config["modules"]
const module_groups = module_config["groups"]

const studiengang_name = "Informatik 2013"
const studiengang = module_config["studiengänge"][studiengang_name]

module_names = Object.keys(module_definitions)

module_sequence = []

for (const module_group of studiengang) {
    group_elements = module_groups[module_group["name"]]
    console.log(module_group["name"])
    if (module_group["num_cp"] === -1) {
        for (const modul_name of group_elements) {
            module_sequence.push(modul_name)
        }
    } else {
        for (let index = 0; index < 1000; index++) {
            configuration = []
            sum_cp = 0
            group_elements = group_elements.sort((a, b) => 0.5 - Math.random())
            for (let index = 0; index < group_elements.length && sum_cp < module_group["num_cp"]; index++) {
                const modul_name = group_elements[index];
                configuration.push(modul_name)
                sum_cp += module_definitions[modul_name]["credits"]
            }
            if (sum_cp === module_group["num_cp"]) {
                for (const modul_name of configuration) {
                    module_sequence.push(modul_name)
                }
                break
            }
        }
        console.log(module_sequence)
    }

}

module_sequence = module_sequence.sort((a, b) => 0.5 - Math.random())

const app = new PIXI.Application({
    width: 1024,         // default: 800
    height: 700,        // default: 600
    antialias: true,    // default: false
    resolution: 1       // default: 1
});

app.renderer.backgroundColor = 0xFFFFFF;

semester_grid = create_semester_grid()
semester_grid.x = 2
semester_grid.y = 2

app.stage.addChild(semester_grid)

current_module = create_modul(module_sequence.pop())

semester_grid.addChild(current_module)

end_msg = ""

game_counter = 1
app.ticker.add(() => {
    if (!finished) {
        if (module_blocked_at_bottom(current_module)) {
            if (module_sequence.length == 0) {
                finished = true
                end_msg = "Du hast das Studium erfolgreich abgeschlossen!"
            } else {
                placed_objects.push(current_module)
                current_module = create_modul(module_sequence.pop())
                current_module.y = 0
                if (module_blocked_at_bottom(current_module)){
                    finished = true
                    end_msg = "Du bist exmatrikuliert..."
                } else {
                    semester_grid.addChild(current_module)
                }
            }
        } else if (game_counter % 100 === 0) {
            move_module_down(current_module)
        }
    } else {
        document.getElementById("game_state").innerHTML = end_msg + " <a href='#' onClick='window.location.reload();'>Retry?</a>"
        app.stop()
    }
    game_counter++
});

document.getElementById("canvas_container").appendChild(app.view)
