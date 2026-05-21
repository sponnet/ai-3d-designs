// Keukeneiland - holle balk, open bovenzijde
// Afmetingen: 60mm x 24mm x 18mm, wanddikte 1mm

length = 60;
width  = 24;
height = 18;
wall   = 1;

module keukeneiland() {
    difference() {
        // Buitenkant
        cube([length, width, height]);

        // Binnenkant (open naar boven: begint op wall-hoogte, reikt tot boven)
        translate([wall, wall, wall])
            cube([length - 2*wall, width - 2*wall, height]);
    }
}

keukeneiland();
