class CreateSpecies < ActiveRecord::Migration[8.1]
  def change
    create_table :species do |t|
      t.string :name

      t.timestamps
    end
  end
end
