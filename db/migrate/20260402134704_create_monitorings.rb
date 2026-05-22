class CreateMonitorings < ActiveRecord::Migration[8.1]
  def change
    create_table :monitorings do |t|
      t.integer :type
      t.string :method
      t.integer :unit
      t.float :data

      t.timestamps
    end
  end
end
